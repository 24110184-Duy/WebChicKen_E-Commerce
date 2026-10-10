import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Calendar,
  Download,
  ChevronDown,
  Truck,
  RotateCcw,
  Search,
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import { sellerApi, type SellerOrder } from '../../features/seller/api/sellerApi'
import { FulfillmentModal } from '../../features/seller/components/FulfillmentModal'
import { SellerOrderDetailModal } from '../../features/seller/components/SellerOrderDetailModal'
import { formatMoney } from '../../shared/lib/formatMoney'
import { toast } from '../../components/feedback/Toast'
import { useAuthStore } from '../../app/store/authStore'
import { PATHS } from '../../app/router/paths'

export const SellerOrdersPage: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  const ORDER_TABS = [
    { id: 'ALL', label: 'All' },
    { id: 'UNPAID', label: 'Unpaid' },
    { id: 'TO_SHIP', label: 'To ship' },
    { id: 'SHIPPING', label: 'Shipping' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLATION', label: 'Cancellation' },
    { id: 'RETURN_REFUND', label: 'Return/Refund' },
  ]

  const [activeTab, setActiveTab] = useState<string>(
    tabParam && ORDER_TABS.some((t) => t.id === tabParam) ? tabParam : 'ALL'
  )

  // Search filter state
  const [searchOrderId, setSearchOrderId] = useState<string>('')
  const [searchType, setSearchType] = useState<'ORDER_ID' | 'BUYER_NAME' | 'TRACKING_NO' | 'PRODUCT_NAME'>('ORDER_ID')
  const [searchTypeOpen, setSearchTypeOpen] = useState<boolean>(false)
  const [submittedQuery, setSubmittedQuery] = useState<string>('')

  // Export scope dropdown
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false)
  const [exportOption, setExportOption] = useState<string>('Order Export')

  // Date range filter
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS'>('ALL')
  const [dateRangeLabel, setDateRangeLabel] = useState<string>('Tất cả thời gian')
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false)

  // Shipping channel / Carrier filter
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ALL')
  const [carrierMenuOpen, setCarrierMenuOpen] = useState<boolean>(false)

  // Orders data
  const [allOrders, setAllOrders] = useState<SellerOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [shopId, setShopId] = useState<string>('')

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState<boolean>(false)
  const [orderToFulfill, setOrderToFulfill] = useState<SellerOrder | null>(null)

  // Refs for click outside
  const exportRef = useRef<HTMLDivElement>(null)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const searchTypeRef = useRef<HTMLDivElement>(null)
  const carrierRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false)
      }
      if (searchTypeRef.current && !searchTypeRef.current.contains(e.target as Node)) {
        setSearchTypeOpen(false)
      }
      if (carrierRef.current && !carrierRef.current.contains(e.target as Node)) {
        setCarrierMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Đồng bộ searchParams URL -> activeTab
  useEffect(() => {
    if (tabParam && ORDER_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam)
    } else if (!tabParam) {
      setActiveTab('ALL')
    }
  }, [tabParam])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      let currentShopId = shopId
      if (!currentShopId) {
        const store = await sellerApi.getMyStore().catch(() => null)
        if (store?.id) {
          currentShopId = store.id
          setShopId(currentShopId)
        } else if (user?.id) {
          const cached = localStorage.getItem(`seller_store_${user.id}`)
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              if (parsed.id) {
                currentShopId = parsed.id
                setShopId(currentShopId)
              }
            } catch {}
          }
        }
      }

      if (currentShopId) {
        // Tải toàn bộ đơn hàng của gian hàng để phục vụ lọc nhanh client-side và hiển thị badge số lượng
        const res = await sellerApi.fetchStoreOrders(currentShopId, {
          status: 'ALL',
          size: 100,
        })
        setAllOrders(res.items || [])
      } else {
        setAllOrders([])
      }
    } catch {
      setAllOrders([])
    } finally {
      setLoading(false)
    }
  }, [shopId, user?.id])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Tính số lượng đơn cho từng tab
  const tabCounts = useMemo(() => {
    return {
      ALL: allOrders.length,
      UNPAID: allOrders.filter((o) => o.paymentStatus === 'UNPAID').length,
      TO_SHIP: allOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING').length,
      SHIPPING: allOrders.filter((o) => o.status === 'SHIPPING').length,
      COMPLETED: allOrders.filter((o) => o.status === 'DELIVERED').length,
      CANCELLATION: allOrders.filter((o) => o.status === 'CANCELLED').length,
      RETURN_REFUND: allOrders.filter((o) => o.status === 'RETURNED').length,
    }
  }, [allOrders])

  // Danh sách các hãng vận chuyển có trong danh sách đơn hàng
  const availableCarriers = useMemo(() => {
    const defaultCarriers = ['Chicky Express', 'GHTK', 'GHN', 'Viettel Post']
    const fromOrders = allOrders
      .map((o) => o.carrier)
      .filter((c): c is string => Boolean(c && c.trim().length > 0))
    return Array.from(new Set([...defaultCarriers, ...fromOrders]))
  }, [allOrders])

  // Lọc đơn hàng dựa trên tất cả thuộc tính: Tab, Ngày tháng, Đơn vị vận chuyển, Từ khóa tìm kiếm
  const displayedOrders = useMemo(() => {
    return allOrders.filter((order) => {
      // 1. Lọc theo Tab trạng thái vòng đời đơn hàng
      if (activeTab === 'UNPAID') {
        if (order.paymentStatus !== 'UNPAID') return false
      } else if (activeTab === 'TO_SHIP') {
        if (order.status !== 'CONFIRMED' && order.status !== 'PENDING') return false
      } else if (activeTab === 'SHIPPING') {
        if (order.status !== 'SHIPPING') return false
      } else if (activeTab === 'COMPLETED') {
        if (order.status !== 'DELIVERED') return false
      } else if (activeTab === 'CANCELLATION') {
        if (order.status !== 'CANCELLED') return false
      } else if (activeTab === 'RETURN_REFUND') {
        if (order.status !== 'RETURNED') return false
      }

      // 2. Lọc theo Khoảng thời gian đặt hàng (orderDate)
      if (dateRangeFilter !== 'ALL') {
        const orderTime = new Date(order.orderDate || Date.now()).getTime()
        const now = Date.now()
        if (dateRangeFilter === 'TODAY') {
          const startOfDay = new Date()
          startOfDay.setHours(0, 0, 0, 0)
          if (orderTime < startOfDay.getTime()) return false
        } else if (dateRangeFilter === '7_DAYS') {
          if (orderTime < now - 7 * 24 * 60 * 60 * 1000) return false
        } else if (dateRangeFilter === '30_DAYS') {
          if (orderTime < now - 30 * 24 * 60 * 60 * 1000) return false
        }
      }

      // 3. Lọc theo Kênh / Đơn vị vận chuyển (Carrier)
      if (selectedCarrier !== 'ALL') {
        const orderCarrier = order.carrier || 'Chicky Express'
        if (orderCarrier.toLowerCase() !== selectedCarrier.toLowerCase()) return false
      }

      // 4. Lọc theo Từ khóa tìm kiếm và Loại thuộc tính
      const query = (submittedQuery || searchOrderId).trim().toLowerCase()
      if (query) {
        if (searchType === 'ORDER_ID') {
          if (!order.orderCode?.toLowerCase().includes(query)) return false
        } else if (searchType === 'TRACKING_NO') {
          if (!order.trackingNumber?.toLowerCase().includes(query)) return false
        } else if (searchType === 'BUYER_NAME') {
          const matchName = order.recipientName?.toLowerCase().includes(query)
          const matchPhone = order.recipientPhone?.includes(query)
          if (!matchName && !matchPhone) return false
        } else if (searchType === 'PRODUCT_NAME') {
          const matchProduct = order.items?.some((i) => i.productName?.toLowerCase().includes(query))
          if (!matchProduct) return false
        } else {
          // Khớp tổng quát nếu tìm chung
          const matchCode = order.orderCode?.toLowerCase().includes(query)
          const matchName = order.recipientName?.toLowerCase().includes(query)
          const matchItem = order.items?.some((i) => i.productName?.toLowerCase().includes(query))
          const matchTrk = order.trackingNumber?.toLowerCase().includes(query)
          if (!matchCode && !matchName && !matchItem && !matchTrk) return false
        }
      }

      return true
    })
  }, [
    allOrders,
    activeTab,
    dateRangeFilter,
    selectedCarrier,
    submittedQuery,
    searchOrderId,
    searchType,
  ])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchOrderId.trim())
  }

  const handleReset = () => {
    setSearchOrderId('')
    setSubmittedQuery('')
    setDateRangeFilter('ALL')
    setDateRangeLabel('Tất cả thời gian')
    setSelectedCarrier('ALL')
    toast.info('Đã đặt lại toàn bộ bộ lọc.')
  }

  const handleOpenDetail = (order: SellerOrder) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
  }

  const handleOpenFulfillment = (order: SellerOrder) => {
    setOrderToFulfill(order)
    setIsFulfillmentModalOpen(true)
  }

  // Xuất file CSV các đơn hàng đang hiển thị theo bộ lọc
  const handleExportCsv = () => {
    if (displayedOrders.length === 0) {
      toast.info('Không có dữ liệu đơn hàng phù hợp với bộ lọc để xuất.')
      return
    }
    const headers = [
      'Mã đơn hàng',
      'Ngày đặt',
      'Khách hàng',
      'Số điện thoại',
      'Trạng thái đơn',
      'Thanh toán',
      'Phương thức TT',
      'Tổng tiền (VNĐ)',
      'Đơn vị vận chuyển',
      'Mã vận đơn',
      'Địa chỉ giao hàng',
    ]
    const rows = displayedOrders.map((o) => [
      `"${o.orderCode}"`,
      `"${new Date(o.orderDate || Date.now()).toLocaleString('vi-VN')}"`,
      `"${o.recipientName || 'Khách hàng'}"`,
      `"${o.recipientPhone || ''}"`,
      `"${o.status}"`,
      `"${o.paymentStatus || 'UNPAID'}"`,
      `"${o.paymentMethod || 'COD'}"`,
      `"${o.totalAmountMinor}"`,
      `"${o.carrier || 'Chicky Express'}"`,
      `"${o.trackingNumber || ''}"`,
      `"${(o.shippingAddress || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `chickymart_orders_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Đã xuất thành công ${displayedOrders.length} đơn hàng ra tệp CSV!`)
  }

  const handleMassShip = () => {
    navigate(`${PATHS.SELLER.SHIPMENT}?tab=MASS_SHIP`)
  }

  // Định dạng màu badge trạng thái rõ ràng, trực quan
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return {
          bg: '#ecfdf5',
          color: '#047857',
          border: '1px solid #a7f3d0',
          label: 'DELIVERED',
        }
      case 'SHIPPING':
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #bfdbfe',
          label: 'SHIPPING',
        }
      case 'CONFIRMED':
        return {
          bg: '#fefce8',
          color: '#a16207',
          border: '1px solid #fef08a',
          label: 'CONFIRMED',
        }
      case 'PENDING':
        return {
          bg: '#fff7ed',
          color: '#c2410c',
          border: '1px solid #fed7aa',
          label: 'PENDING',
        }
      case 'CANCELLED':
        return {
          bg: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
          label: 'CANCELLED',
        }
      case 'RETURNED':
        return {
          bg: '#faf5ff',
          color: '#7e22ce',
          border: '1px solid #e9d5ff',
          label: 'RETURNED',
        }
      default:
        return {
          bg: '#f8fafc',
          color: '#475569',
          border: '1px solid #e2e8f0',
          label: status,
        }
    }
  }

  // Cột đếm ngược / Tiến độ giao hàng thông minh dựa trên thuộc tính đơn hàng
  const renderCountdown = (order: SellerOrder) => {
    if (order.status === 'DELIVERED') {
      return (
        <div>
          <span style={{ color: '#16a34a', fontWeight: 600 }}>Giao thành công</span>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>Hoàn tất đơn hàng</div>
        </div>
      )
    }
    if (order.status === 'CANCELLED') {
      return (
        <div>
          <span style={{ color: '#dc2626', fontWeight: 600 }}>Đã hủy đơn</span>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>Không giao</div>
        </div>
      )
    }
    if (order.status === 'RETURNED') {
      return (
        <div>
          <span style={{ color: '#9333ea', fontWeight: 600 }}>Trả hàng/Hoàn tiền</span>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>Đã hoàn tất khiếu nại</div>
        </div>
      )
    }
    if (order.status === 'SHIPPING') {
      return (
        <div>
          <span style={{ color: '#2563eb', fontWeight: 600 }}>Đang vận chuyển</span>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {order.trackingNumber ? `Mã: ${order.trackingNumber}` : 'Đang giao'}
          </div>
        </div>
      )
    }
    if (order.status === 'CONFIRMED') {
      // Hạn gửi hàng (SLA: 2 ngày tính từ thời điểm đặt hàng)
      const orderTime = new Date(order.orderDate || Date.now()).getTime()
      const deadline = orderTime + 2 * 24 * 60 * 60 * 1000
      const remainingMs = deadline - Date.now()
      const remainingHours = Math.round(remainingMs / (1000 * 60 * 60))

      if (remainingHours > 24) {
        return (
          <span style={{ color: '#d97706', fontWeight: 600 }}>
            Còn {Math.ceil(remainingHours / 24)} ngày gửi
          </span>
        )
      } else if (remainingHours > 0) {
        return (
          <span style={{ color: '#ea580c', fontWeight: 600 }}>
            Còn {remainingHours} giờ để gửi
          </span>
        )
      } else {
        return (
          <span style={{ color: '#dc2626', fontWeight: 600 }}>
            Quá hạn chuẩn bị
          </span>
        )
      }
    }
    if (order.status === 'PENDING') {
      return (
        <span style={{ color: '#ea580c', fontWeight: 500 }}>
          Chờ người bán xác nhận
        </span>
      )
    }
    return <span style={{ color: '#595959' }}>Theo dõi vận đơn</span>
  }

  return (
    <SellerLayout>
      <div style={{ padding: '20px 24px', backgroundColor: '#f6f6f6', minHeight: 'calc(100vh - 64px)' }}>
        {/* ── 1. Main Status Tabs kèm Badge số lượng trực quan ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '4px 4px 0 0',
            borderBottom: '1px solid #e8e8e8',
            display: 'flex',
            padding: '0 20px',
            gap: 28,
            overflowX: 'auto',
          }}
        >
          {ORDER_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const count = tabCounts[tab.id as keyof typeof tabCounts] ?? 0
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '16px 4px',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ca8a04' : '#595959',
                  cursor: 'pointer',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: 12,
                    backgroundColor: isActive ? '#fef08a' : '#f1f5f9',
                    color: isActive ? '#854d0e' : '#64748b',
                  }}
                >
                  {count}
                </span>
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: '#eab308',
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* ── 2. Filter Box Hoạt Động Theo Mọi Thuộc Tính Thực Tế ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '20px 24px',
            border: '1px solid #e8e8e8',
            borderTop: 'none',
            marginBottom: 16,
          }}
        >
          {/* Row 1: Scope Export + Date Range + Shipping Carrier + Export Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Order Export Scope Dropdown */}
              <div style={{ position: 'relative' }} ref={exportRef}>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    backgroundColor: '#ffffff',
                    fontSize: 13,
                    color: '#595959',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <span>{exportOption}</span>
                  <ChevronDown style={{ width: 12, height: 12 }} />
                </button>

                {exportMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 4,
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      padding: 4,
                      width: 200,
                      zIndex: 50,
                    }}
                  >
                    {[
                      'Order Export (Tất cả)',
                      'Đơn chờ xử lý',
                      'Đơn đang giao',
                      'Đơn đã hoàn tất',
                      'Đơn khiếu nại/hủy',
                    ].map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          setExportOption(opt)
                          setExportMenuOpen(false)
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          color: '#334155',
                          borderRadius: 4,
                          cursor: 'pointer',
                          backgroundColor: exportOption === opt ? '#fef9c3' : 'transparent',
                          fontWeight: exportOption === opt ? 700 : 400,
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range Picker Dropdown (Hoạt động lọc thật) */}
              <div style={{ position: 'relative' }} ref={datePickerRef}>
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    backgroundColor: '#ffffff',
                    fontSize: 13,
                    color: '#262626',
                    cursor: 'pointer',
                  }}
                >
                  <Calendar style={{ width: 14, height: 14, color: '#8c8c8c' }} />
                  <span>{dateRangeLabel}</span>
                  <ChevronDown style={{ width: 12, height: 12, color: '#8c8c8c' }} />
                </button>

                {datePickerOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 4,
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      padding: 4,
                      width: 230,
                      zIndex: 50,
                    }}
                  >
                    {[
                      { id: 'ALL', label: 'Tất cả thời gian (All)' },
                      { id: 'TODAY', label: 'Hôm nay (Today)' },
                      { id: '7_DAYS', label: '7 ngày qua (Last 7 days)' },
                      { id: '30_DAYS', label: '30 ngày qua (Last 30 days)' },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setDateRangeFilter(item.id as any)
                          setDateRangeLabel(item.label)
                          setDatePickerOpen(false)
                          toast.info(`Đã áp dụng mốc: ${item.label}`)
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          color: '#334155',
                          borderRadius: 4,
                          cursor: 'pointer',
                          backgroundColor: dateRangeFilter === item.id ? '#fef9c3' : 'transparent',
                          fontWeight: dateRangeFilter === item.id ? 700 : 400,
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipping Channel / Carrier Filter Dropdown (Lọc đơn vị vận chuyển) */}
              <div style={{ position: 'relative' }} ref={carrierRef}>
                <button
                  type="button"
                  onClick={() => setCarrierMenuOpen(!carrierMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    backgroundColor: '#ffffff',
                    fontSize: 13,
                    color: '#262626',
                    cursor: 'pointer',
                  }}
                >
                  <Truck style={{ width: 14, height: 14, color: '#8c8c8c' }} />
                  <span>
                    {selectedCarrier === 'ALL'
                      ? 'Tất cả đơn vị vận chuyển'
                      : selectedCarrier}
                  </span>
                  <ChevronDown style={{ width: 12, height: 12, color: '#8c8c8c' }} />
                </button>

                {carrierMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 4,
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      padding: 4,
                      width: 220,
                      zIndex: 50,
                    }}
                  >
                    <div
                      onClick={() => {
                        setSelectedCarrier('ALL')
                        setCarrierMenuOpen(false)
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: 12,
                        color: '#334155',
                        borderRadius: 4,
                        cursor: 'pointer',
                        backgroundColor: selectedCarrier === 'ALL' ? '#fef9c3' : 'transparent',
                        fontWeight: selectedCarrier === 'ALL' ? 700 : 400,
                      }}
                    >
                      Tất cả đơn vị vận chuyển (All)
                    </div>
                    {availableCarriers.map((carrierName) => (
                      <div
                        key={carrierName}
                        onClick={() => {
                          setSelectedCarrier(carrierName)
                          setCarrierMenuOpen(false)
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          color: '#334155',
                          borderRadius: 4,
                          cursor: 'pointer',
                          backgroundColor: selectedCarrier === carrierName ? '#fef9c3' : 'transparent',
                          fontWeight: selectedCarrier === carrierName ? 700 : 400,
                        }}
                      >
                        {carrierName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d9d9d9',
                color: '#595959',
                padding: '6px 16px',
                borderRadius: 4,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={handleExportCsv}
            >
              <Download style={{ width: 14, height: 14 }} />
              <span>Export</span>
            </button>
          </div>

          {/* Row 2: Search Type + Input + Search + Reset */}
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: 540 }}>
              <div style={{ position: 'relative' }} ref={searchTypeRef}>
                <button
                  type="button"
                  onClick={() => setSearchTypeOpen(!searchTypeOpen)}
                  style={{
                    padding: '7px 12px',
                    border: '1px solid #d9d9d9',
                    borderRight: 'none',
                    borderRadius: '4px 0 0 4px',
                    backgroundColor: '#fafafa',
                    fontSize: 13,
                    color: '#595959',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <span>
                    {searchType === 'ORDER_ID'
                      ? 'Order ID'
                      : searchType === 'TRACKING_NO'
                      ? 'Tracking No'
                      : searchType === 'PRODUCT_NAME'
                      ? 'Product Name'
                      : 'Buyer Name'}
                  </span>
                  <ChevronDown style={{ width: 12, height: 12 }} />
                </button>

                {searchTypeOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 4,
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      padding: 4,
                      width: 150,
                      zIndex: 50,
                    }}
                  >
                    {[
                      { id: 'ORDER_ID', label: 'Order ID' },
                      { id: 'BUYER_NAME', label: 'Buyer Name' },
                      { id: 'TRACKING_NO', label: 'Tracking No' },
                      { id: 'PRODUCT_NAME', label: 'Product Name' },
                    ].map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSearchType(st.id as any)
                          setSearchTypeOpen(false)
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          color: '#334155',
                          borderRadius: 4,
                          cursor: 'pointer',
                          backgroundColor: searchType === st.id ? '#fef9c3' : 'transparent',
                          fontWeight: searchType === st.id ? 700 : 400,
                        }}
                      >
                        {st.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder={
                  searchType === 'ORDER_ID'
                    ? 'Nhập mã đơn hàng (ORD-...)'
                    : searchType === 'TRACKING_NO'
                    ? 'Nhập mã vận đơn...'
                    : searchType === 'PRODUCT_NAME'
                    ? 'Nhập tên sản phẩm...'
                    : 'Nhập tên hoặc SĐT khách hàng...'
                }
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '0 4px 4px 0',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#facc15',
                border: 'none',
                color: '#0f172a',
                padding: '7px 22px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Search style={{ width: 14, height: 14 }} />
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d9d9d9',
                color: '#595959',
                padding: '7px 18px',
                borderRadius: 4,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RotateCcw style={{ width: 13, height: 13 }} />
              <span>Reset</span>
            </button>
          </form>
        </div>

        {/* ── 3. Table Actions: Số lượng đơn hàng thực tế theo bộ lọc ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '14px 20px',
            border: '1px solid #e8e8e8',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>
            {displayedOrders.length} {displayedOrders.length === 1 ? 'Order' : 'Orders'}
          </div>

          <button
            type="button"
            onClick={handleMassShip}
            style={{
              backgroundColor: '#facc15',
              border: 'none',
              color: '#0f172a',
              padding: '7px 20px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Truck style={{ width: 14, height: 14 }} />
            <span>Mass Ship</span>
          </button>
        </div>

        {/* ── 4. Table Container ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr',
              backgroundColor: '#fafafa',
              padding: '12px 18px',
              borderBottom: '1px solid #e8e8e8',
              fontSize: 13,
              fontWeight: 600,
              color: '#595959',
            }}
          >
            <div>Product(s)</div>
            <div>Order Total</div>
            <div>Status</div>
            <div>Countdown</div>
            <div>
              {selectedCarrier === 'ALL' ? 'All Channels' : selectedCarrier}
            </div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#8c8c8c' }}>
              <div className="cart-spinner" style={{ width: 28, height: 28, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, margin: 0 }}>Loading orders...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            /* Empty state khi không có đơn thỏa mãn bộ lọc */
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#f5f5f5',
                  color: '#bfbfbf',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <ClipboardList style={{ width: 28, height: 28 }} />
              </div>
              <div style={{ fontSize: 14, color: '#8c8c8c' }}>
                No Orders Found for Selected Filters
              </div>
            </div>
          ) : (
            <div>
              {displayedOrders.map((order) => {
                const badge = getStatusBadgeStyle(order.status)
                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr',
                      padding: '16px 18px',
                      borderBottom: '1px solid #f0f0f0',
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    {/* Products */}
                    <div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                        Mã đơn: <strong style={{ color: '#1e293b' }}>{order.orderCode}</strong>
                      </div>
                      {order.items?.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 4,
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                color: '#94a3b8',
                              }}
                            >
                              SP
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: '#262626' }}>{item.productName}</div>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>x{item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div>
                      <div style={{ fontWeight: 700, color: '#ca8a04' }}>
                        {formatMoney(order.totalAmountMinor)}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {order.paymentMethod || 'COD'} • {order.paymentStatus || 'UNPAID'}
                      </div>
                    </div>

                    {/* Status Badge với màu sắc phân biệt */}
                    <div>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Countdown / Trạng thái tiến độ thực tế */}
                    <div>{renderCountdown(order)}</div>

                    {/* Channels / Đơn vị vận chuyển */}
                    <div style={{ color: '#595959' }}>
                      {order.carrier || 'Chicky Express'}
                    </div>

                    {/* Actions */}
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #d9d9d9',
                          color: '#595959',
                          padding: '5px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOpenDetail(order)}
                      >
                        Chi tiết
                      </button>
                      {order.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          style={{
                            backgroundColor: '#facc15',
                            border: 'none',
                            color: '#0f172a',
                            padding: '5px 12px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenFulfillment(order)}
                        >
                          Giao hàng
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal chi tiết đơn hàng */}
        {isDetailModalOpen && selectedOrder && (
          <SellerOrderDetailModal
            isOpen={isDetailModalOpen}
            order={selectedOrder}
            onClose={() => setIsDetailModalOpen(false)}
            onConfirmOrder={async (order) => {
              if (order.storeId) {
                await sellerApi.updateStoreOrderStatus(order.storeId, order.orderCode, { status: 'CONFIRMED' })
                toast.success('Đã xác nhận đơn hàng!')
                setIsDetailModalOpen(false)
                loadOrders()
              }
            }}
            onOpenFulfillment={(order) => {
              setIsDetailModalOpen(false)
              handleOpenFulfillment(order)
            }}
            onMarkDelivered={async (order) => {
              if (order.storeId) {
                await sellerApi.updateStoreOrderStatus(order.storeId, order.orderCode, { status: 'DELIVERED' })
                toast.success('Đã xác nhận giao hàng thành công!')
                setIsDetailModalOpen(false)
                loadOrders()
              }
            }}
            onCancelOrder={async (order) => {
              if (order.storeId) {
                await sellerApi.updateStoreOrderStatus(order.storeId, order.orderCode, { status: 'CANCELLED' })
                toast.success('Đã hủy đơn hàng.')
                setIsDetailModalOpen(false)
                loadOrders()
              }
            }}
          />
        )}

        {/* Modal xử lý vận chuyển */}
        {isFulfillmentModalOpen && orderToFulfill && (
          <FulfillmentModal
            isOpen={isFulfillmentModalOpen}
            order={orderToFulfill}
            onClose={() => setIsFulfillmentModalOpen(false)}
            onSubmit={async (payload) => {
              if (orderToFulfill.storeId) {
                await sellerApi.updateStoreOrderStatus(orderToFulfill.storeId, orderToFulfill.orderCode, payload)
                toast.success('Đã cập nhật trạng thái giao hàng!')
                setIsFulfillmentModalOpen(false)
                loadOrders()
              }
            }}
          />
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerOrdersPage
