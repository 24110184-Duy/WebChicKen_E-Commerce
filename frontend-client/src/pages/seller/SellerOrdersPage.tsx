import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Calendar,
  Download,
  ChevronDown,
  Truck,
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

  const [searchOrderId, setSearchOrderId] = useState<string>('')
  const [searchType, setSearchType] = useState<'ORDER_ID' | 'BUYER_NAME' | 'TRACKING_NO'>('ORDER_ID')
  const [searchTypeOpen, setSearchTypeOpen] = useState<boolean>(false)

  // Export dropdown & Date range
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false)
  const [exportOption, setExportOption] = useState<string>('Order Export')
  const [dateRangeLabel, setDateRangeLabel] = useState<string>('2026/09/10 — 2026/10/10')
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false)

  const [orders, setOrders] = useState<SellerOrder[]>([])
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
        let statusParam = 'ALL'
        if (activeTab === 'TO_SHIP') statusParam = 'CONFIRMED'
        else if (activeTab === 'CANCELLATION') statusParam = 'CANCELLED'
        else if (activeTab === 'RETURN_REFUND') statusParam = 'RETURNED'
        else if (activeTab !== 'ALL') statusParam = activeTab

        const res = await sellerApi.fetchStoreOrders(currentShopId, {
          status: statusParam,
          q: searchOrderId.trim(),
        })
        setOrders(res.items || [])
      } else {
        setOrders([])
      }
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [shopId, activeTab, searchOrderId, user?.id])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadOrders()
  }

  const handleReset = () => {
    setSearchOrderId('')
    loadOrders()
  }

  const handleOpenDetail = (order: SellerOrder) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
  }

  const handleOpenFulfillment = (order: SellerOrder) => {
    setOrderToFulfill(order)
    setIsFulfillmentModalOpen(true)
  }

  // Tải file CSV thật sự
  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.info('Không có dữ liệu đơn hàng để xuất.')
      return
    }
    const headers = ['Mã đơn hàng', 'Ngày đặt', 'Khách hàng', 'Trạng thái', 'Tổng tiền (VNĐ)', 'Đơn vị vận chuyển', 'Địa chỉ giao hàng']
    const rows = orders.map((o) => [
      `"${o.orderCode}"`,
      `"${new Date(o.orderDate || Date.now()).toLocaleString('vi-VN')}"`,
      `"${o.recipientName || 'Khách hàng'}"`,
      `"${o.status}"`,
      `"${o.totalAmountMinor}"`,
      `"${o.carrier || 'Chicky Express'}"`,
      `"${o.shippingAddress || ''}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `chickymart_orders_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Đã xuất thành công ${orders.length} đơn hàng ra tệp CSV!`)
  }

  const handleMassShip = () => {
    navigate(`${PATHS.SELLER.SHIPMENT}?tab=MASS_SHIP`)
  }

  return (
    <SellerLayout>
      <div style={{ padding: '20px 24px', backgroundColor: '#f6f6f6', minHeight: 'calc(100vh - 64px)' }}>
        {/* ── 1. Main Status Tabs (Ảnh 3) ── */}
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
                }}
              >
                <span>{tab.label}</span>
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

        {/* ── 2. Filter Box (Ảnh 3) ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '20px 24px',
            border: '1px solid #e8e8e8',
            borderTop: 'none',
            marginBottom: 16,
          }}
        >
          {/* Row 1: Order Export Dropdown + Date Range + Export Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                      width: 180,
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

              {/* Date Range Picker Dropdown */}
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
                      width: 220,
                      zIndex: 50,
                    }}
                  >
                    {[
                      { label: 'Hôm nay (Today)', val: '2026/10/10 — 2026/10/10' },
                      { label: '7 ngày qua (Last 7 days)', val: '2026/10/03 — 2026/10/10' },
                      { label: '30 ngày qua (Last 30 days)', val: '2026/09/10 — 2026/10/10' },
                      { label: 'Tất cả thời gian (All)', val: '2026/01/01 — 2026/10/10' },
                    ].map((item) => (
                      <div
                        key={item.val}
                        onClick={() => {
                          setDateRangeLabel(item.val)
                          setDatePickerOpen(false)
                          toast.info(`Áp dụng mốc: ${item.label}`)
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          color: '#334155',
                          borderRadius: 4,
                          cursor: 'pointer',
                          backgroundColor: dateRangeLabel === item.val ? '#fef9c3' : 'transparent',
                          fontWeight: dateRangeLabel === item.val ? 700 : 400,
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Export Button */}
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
                      width: 140,
                      zIndex: 50,
                    }}
                  >
                    {[
                      { id: 'ORDER_ID', label: 'Order ID' },
                      { id: 'TRACKING_NO', label: 'Tracking No' },
                      { id: 'BUYER_NAME', label: 'Buyer Name' },
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
                    ? 'Input order ID'
                    : searchType === 'TRACKING_NO'
                    ? 'Input tracking number'
                    : 'Input buyer username'
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
              }}
            >
              Search
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
              }}
            >
              Reset
            </button>
          </form>
        </div>

        {/* ── 3. Table Actions (Ảnh 3) ── */}
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
            {orders.length} Orders
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
            <div>All Channels</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#8c8c8c' }}>
              <div className="cart-spinner" style={{ width: 28, height: 28, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, margin: 0 }}>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            /* Empty state (Ảnh 3) */
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
              <div style={{ fontSize: 14, color: '#8c8c8c' }}>No Orders Found</div>
            </div>
          ) : (
            <div>
              {orders.map((order) => (
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
                      Mã đơn: <strong>{order.orderCode}</strong>
                    </div>
                    {order.items?.map((item) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#262626' }}>{item.productName}</div>
                          <div style={{ fontSize: 11, color: '#8c8c8c' }}>x{item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div style={{ fontWeight: 700, color: '#ca8a04' }}>
                    {formatMoney(order.totalAmountMinor)}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      style={{
                        backgroundColor: '#fef9c3',
                        color: '#854d0e',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Countdown */}
                  <div style={{ color: '#595959', fontSize: 12 }}>3 days remaining</div>

                  {/* Channels */}
                  <div style={{ color: '#595959' }}>{order.carrier || 'Chicky Express'}</div>

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
              ))}
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
