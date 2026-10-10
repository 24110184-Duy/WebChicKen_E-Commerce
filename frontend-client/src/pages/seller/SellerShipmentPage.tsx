import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Truck,
  Calendar,
  Download,
  Upload,
  ChevronDown,
  ArrowUpDown,
  X,
  FileSpreadsheet,
  Settings,
  MapPin,
  Phone,
  User,
  Save,
  Check,
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import { sellerApi, type SellerOrder } from '../../features/seller/api/sellerApi'
import { formatMoney } from '../../shared/lib/formatMoney'
import { toast } from '../../components/feedback/Toast'
import { useAuthStore } from '../../app/store/authStore'

export const SellerShipmentPage: React.FC = () => {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTabParam = searchParams.get('tab') || 'TO_SHIP'

  // Chế độ xem: 'SHIPMENT' | 'MASS_SHIP' | 'SETTING'
  const isSettingView = currentTabParam === 'SETTING'
  const isMassShipView = currentTabParam === 'MASS_SHIP'

  // Main status tab khi ở chế độ Shipment thường
  const [activeMainTab, setActiveMainTab] = useState<string>(
    ['ALL', 'UNPAID', 'TO_SHIP', 'SHIPPING', 'COMPLETED', 'CANCELLATION', 'RETURN_REFUND'].includes(currentTabParam)
      ? currentTabParam
      : 'TO_SHIP'
  )

  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'TO_PROCESS' | 'PROCESSED'>('ALL')
  const [searchOrderId, setSearchOrderId] = useState<string>('')
  const [searchType, setSearchType] = useState<'ORDER_ID' | 'TRACKING_NO' | 'BUYER_NAME'>('ORDER_ID')
  const [searchTypeOpen, setSearchTypeOpen] = useState<boolean>(false)

  // Date range state
  const [dateRangeLabel, setDateRangeLabel] = useState<string>('2026/09/10 — 2026/10/10')
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false)

  // Sort state
  const [sortOption, setSortOption] = useState<'NEWEST' | 'OLDEST' | 'PRICE_HIGH' | 'PRICE_LOW'>('NEWEST')
  const [sortOpen, setSortOpen] = useState<boolean>(false)

  // Modal Mass Upload IMEI/SN
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)
  const [uploadFileName, setUploadFileName] = useState<string>('')

  // Selected orders for mass operations
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  // Shipping settings state (lưu localStorage)
  const [shippingChannels, setShippingChannels] = useState<{ [key: string]: boolean }>({
    chicky_express: true,
    instant_express: true,
    ghtk: true,
    ninja_van: false,
    cod: true,
  })
  const [pickupAddress, setPickupAddress] = useState({
    senderName: user?.fullName || 'ChickyMart Shop',
    phone: user?.phone || '0901234567',
    address: '123 Đường Số 1, Phường Tân Phú, TP. Hồ Chí Minh',
  })

  // Dữ liệu đơn hàng
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [shopId, setShopId] = useState<string>('')

  // Refs for closing popups on click outside
  const searchTypeRef = useRef<HTMLDivElement>(null)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchTypeRef.current && !searchTypeRef.current.contains(e.target as Node)) {
        setSearchTypeOpen(false)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Đồng bộ URL search param với activeMainTab khi không phải MASS_SHIP hay SETTING
  useEffect(() => {
    if (!isSettingView && !isMassShipView) {
      if (['ALL', 'UNPAID', 'TO_SHIP', 'SHIPPING', 'COMPLETED', 'CANCELLATION', 'RETURN_REFUND'].includes(currentTabParam)) {
        setActiveMainTab(currentTabParam)
      }
    }
  }, [currentTabParam, isSettingView, isMassShipView])

  // Tải cài đặt vận chuyển từ local storage nếu có
  useEffect(() => {
    if (user?.id) {
      const savedChannels = localStorage.getItem(`seller_shipping_channels_${user.id}`)
      if (savedChannels) {
        try { setShippingChannels(JSON.parse(savedChannels)) } catch {}
      }
      const savedPickup = localStorage.getItem(`seller_pickup_address_${user.id}`)
      if (savedPickup) {
        try { setPickupAddress(JSON.parse(savedPickup)) } catch {}
      }
    }
  }, [user?.id])

  const MAIN_TABS = [
    { id: 'ALL', label: 'All' },
    { id: 'UNPAID', label: 'Unpaid' },
    { id: 'TO_SHIP', label: 'To ship' },
    { id: 'SHIPPING', label: 'Shipping' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLATION', label: 'Cancellation' },
    { id: 'RETURN_REFUND', label: 'Return/Refund' },
  ]

  const loadShipmentOrders = async () => {
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
        if (isMassShipView) {
          statusParam = 'CONFIRMED'
        } else if (activeMainTab === 'TO_SHIP') {
          statusParam = 'CONFIRMED'
        } else if (activeMainTab === 'CANCELLATION') {
          statusParam = 'CANCELLED'
        } else if (activeMainTab === 'RETURN_REFUND') {
          statusParam = 'RETURNED'
        } else if (activeMainTab !== 'ALL') {
          statusParam = activeMainTab
        }

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
  }

  useEffect(() => {
    if (!isSettingView) {
      loadShipmentOrders()
    }
  }, [activeMainTab, isMassShipView, isSettingView])

  const handleTabChange = (tabId: string) => {
    setActiveMainTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadShipmentOrders()
  }

  const handleReset = () => {
    setSearchOrderId('')
    loadShipmentOrders()
  }

  // Lọc và sắp xếp đơn hàng hiển thị
  const filteredOrders = useMemo(() => {
    let list = [...orders]

    // Lọc theo sub-tab
    if (activeSubTab === 'TO_PROCESS') {
      list = list.filter((o) => !o.carrier || o.status === 'CONFIRMED')
    } else if (activeSubTab === 'PROCESSED') {
      list = list.filter((o) => o.status === 'SHIPPING' || o.status === 'DELIVERED')
    }

    // Sắp xếp
    if (sortOption === 'NEWEST') {
      list.sort((a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime())
    } else if (sortOption === 'OLDEST') {
      list.sort((a, b) => new Date(a.orderDate || 0).getTime() - new Date(b.orderDate || 0).getTime())
    } else if (sortOption === 'PRICE_HIGH') {
      list.sort((a, b) => b.totalAmountMinor - a.totalAmountMinor)
    } else if (sortOption === 'PRICE_LOW') {
      list.sort((a, b) => a.totalAmountMinor - b.totalAmountMinor)
    }

    return list
  }, [orders, activeSubTab, sortOption])

  // Xuất file CSV thật sự
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      toast.info('Không có dữ liệu đơn hàng để xuất.')
      return
    }
    const headers = ['Order Code', 'Created At', 'Status', 'Total Price (VND)', 'Carrier', 'Customer Note']
    const rows = filteredOrders.map((o) => [
      `"${o.orderCode}"`,
      `"${new Date(o.orderDate || Date.now()).toLocaleString('vi-VN')}"`,
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
    link.setAttribute('download', `chickymart_shipment_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Đã xuất thành công ${filteredOrders.length} đơn hàng ra file CSV!`)
  }

  // Chọn tất cả đơn hàng
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id))
    }
  }

  // Chọn từng đơn
  const handleToggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((item) => item !== id))
    } else {
      setSelectedOrderIds([...selectedOrderIds, id])
    }
  }

  // Thao tác Mass Ship
  const handleMassShipAction = (actionType: 'GENERATE_CODE' | 'PRINT_LABELS' | 'CONFIRM_HANDOVER') => {
    const count = selectedOrderIds.length > 0 ? selectedOrderIds.length : filteredOrders.length
    if (count === 0) {
      toast.info('Không có đơn hàng nào được chọn.')
      return
    }
    if (actionType === 'GENERATE_CODE') {
      toast.success(`Đã tạo mã vận đơn hàng loạt cho ${count} đơn hàng!`)
    } else if (actionType === 'PRINT_LABELS') {
      toast.success(`Đang mở phiếu gửi hàng PDF cho ${count} đơn hàng...`)
    } else {
      toast.success(`Đã xác nhận bàn giao ${count} đơn hàng cho bên vận chuyển!`)
      setSelectedOrderIds([])
      loadShipmentOrders()
    }
  }

  // Lưu cài đặt vận chuyển
  const handleSaveShippingSettings = () => {
    if (user?.id) {
      localStorage.setItem(`seller_shipping_channels_${user.id}`, JSON.stringify(shippingChannels))
      localStorage.setItem(`seller_pickup_address_${user.id}`, JSON.stringify(pickupAddress))
    }
    toast.success('Đã lưu cấu hình cài đặt vận chuyển thành công!')
  }

  return (
    <SellerLayout>
      <div style={{ padding: '20px 24px', backgroundColor: '#f6f6f6', minHeight: 'calc(100vh - 64px)' }}>
        {/* ========================================================= */}
        {/* VIEW 1: SHIPPING SETTING (?tab=SETTING) */}
        {/* ========================================================= */}
        {isSettingView ? (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Settings style={{ width: 22, height: 22, color: '#ca8a04' }} />
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Shipping Setting (Cài đặt vận chuyển)
                </h1>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 32px' }}>
                Quản lý các kênh vận chuyển được hỗ trợ, phương thức giao nhận và địa chỉ kho lấy hàng của cửa hàng.
              </p>
            </div>

            {/* Channels Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                1. Kênh vận chuyển kích hoạt
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { id: 'chicky_express', name: 'Chicky Express', desc: 'Giao hàng tiêu chuẩn 1 - 2 ngày làm việc', tag: 'Được khuyến nghị' },
                  { id: 'instant_express', name: 'Hỏa Tốc / Instant Express', desc: 'Giao hàng siêu tốc trong vòng 2 giờ nội thành', tag: 'Tốc độ cao' },
                  { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm (GHTK)', desc: 'Vận chuyển toàn quốc phủ sóng 63 tỉnh thành', tag: 'Tiết kiệm' },
                  { id: 'ninja_van', name: 'Ninja Van', desc: 'Đối tác giao nhận thương mại điện tử chuyên nghiệp', tag: 'Đối tác' },
                ].map((channel) => {
                  const isEnabled = shippingChannels[channel.id]
                  return (
                    <div
                      key={channel.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: 6,
                        border: '1px solid #f1f5f9',
                        backgroundColor: isEnabled ? '#fefce8' : '#fafafa',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{channel.name}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: '#fef08a', color: '#854d0e', fontWeight: 600 }}>
                            {channel.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{channel.desc}</div>
                      </div>

                      {/* Toggle button */}
                      <button
                        type="button"
                        onClick={() => setShippingChannels({ ...shippingChannels, [channel.id]: !isEnabled })}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: isEnabled ? '#eab308' : '#cbd5e1',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background-color 0.2s',
                          padding: 2,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            transform: isEnabled ? 'translateX(20px)' : 'translateX(0)',
                            transition: 'transform 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* COD Toggle */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Thanh toán khi nhận hàng (COD)</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Cho phép khách hàng thanh toán tiền mặt khi bưu tá giao kiện hàng</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShippingChannels({ ...shippingChannels, cod: !shippingChannels.cod })}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: shippingChannels.cod ? '#eab308' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                    padding: 2,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      transform: shippingChannels.cod ? 'translateX(20px)' : 'translateX(0)',
                      transition: 'transform 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Pickup Address Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                2. Địa chỉ lấy hàng (Pickup Address)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Tên người gửi / Đại diện kho
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                    <User style={{ width: 15, height: 15, color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={pickupAddress.senderName}
                      onChange={(e) => setPickupAddress({ ...pickupAddress, senderName: e.target.value })}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Số điện thoại liên hệ bưu tá
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                    <Phone style={{ width: 15, height: 15, color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={pickupAddress.phone}
                      onChange={(e) => setPickupAddress({ ...pickupAddress, phone: e.target.value })}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Địa chỉ chi tiết kho hàng
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <MapPin style={{ width: 15, height: 15, color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={pickupAddress.address}
                    onChange={(e) => setPickupAddress({ ...pickupAddress, address: e.target.value })}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'TO_SHIP' })}
                style={{
                  padding: '9px 20px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveShippingSettings}
                style={{
                  padding: '9px 24px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#facc15',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Save style={{ width: 15, height: 15 }} />
                <span>Lưu cài đặt</span>
              </button>
            </div>
          </div>
        ) : isMassShipView ? (
          /* ========================================================= */
          /* VIEW 2: MASS SHIP (?tab=MASS_SHIP)                        */
          /* ========================================================= */
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck style={{ width: 22, height: 22, color: '#ca8a04' }} />
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Mass Ship (Giao hàng loạt)
                </h1>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 32px' }}>
                Xử lý giao hàng đồng thời cho nhiều đơn hàng: Tạo mã vận đơn, in phiếu gửi và bàn giao cho bưu tá cùng lúc.
              </p>
            </div>

            {/* Mass Ship Action Control Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '16px 20px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleToggleSelectAll}
                    style={{ width: 16, height: 16, accentColor: '#eab308' }}
                  />
                  <span>Chọn tất cả ({selectedOrderIds.length}/{filteredOrders.length})</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleMassShipAction('GENERATE_CODE')}
                  style={{
                    backgroundColor: '#fefce8',
                    border: '1px solid #ca8a04',
                    color: '#854d0e',
                    padding: '7px 16px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Tạo mã vận đơn hàng loạt
                </button>
                <button
                  type="button"
                  onClick={() => handleMassShipAction('PRINT_LABELS')}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d9d9d9',
                    color: '#0f172a',
                    padding: '7px 16px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  In phiếu gửi hàng loạt
                </button>
                <button
                  type="button"
                  onClick={() => handleMassShipAction('CONFIRM_HANDOVER')}
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
                  <Check style={{ width: 14, height: 14 }} />
                  <span>Xác nhận giao bưu tá</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 3fr 1.5fr 1.5fr 1.5fr 1.5fr',
                  backgroundColor: '#fafafa',
                  padding: '12px 18px',
                  borderBottom: '1px solid #e8e8e8',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#595959',
                }}
              >
                <div></div>
                <div>Đơn hàng / Sản phẩm</div>
                <div>Tổng tiền</div>
                <div>Trạng thái</div>
                <div>Kênh vận chuyển</div>
                <div style={{ textAlign: 'right' }}>Thao tác</div>
              </div>

              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#8c8c8c' }}>
                  <div className="cart-spinner" style={{ width: 28, height: 28, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Đang tải danh sách giao hàng loạt...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
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
                    <Truck style={{ width: 28, height: 28 }} />
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>Không có đơn hàng nào cần giao hàng loạt</div>
                </div>
              ) : (
                <div>
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.id)
                    return (
                      <div
                        key={order.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 3fr 1.5fr 1.5fr 1.5fr 1.5fr',
                          padding: '16px 18px',
                          borderBottom: '1px solid #f0f0f0',
                          alignItems: 'center',
                          fontSize: 13,
                          backgroundColor: isSelected ? '#fefce8' : 'transparent',
                        }}
                      >
                        <div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOrder(order.id)}
                            style={{ width: 16, height: 16, accentColor: '#eab308' }}
                          />
                        </div>
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
                                  style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 600, color: '#262626' }}>{item.productName}</div>
                                <div style={{ fontSize: 11, color: '#8c8c8c' }}>x{item.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontWeight: 700, color: '#ca8a04' }}>
                          {formatMoney(order.totalAmountMinor)}
                        </div>
                        <div>
                          <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                            {order.status}
                          </span>
                        </div>
                        <div style={{ color: '#595959' }}>{order.carrier || 'Chicky Express'}</div>
                        <div style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => toast.success(`Đã chuẩn bị phiếu giao cho đơn ${order.orderCode}`)}
                            style={{
                              backgroundColor: '#facc15',
                              border: 'none',
                              color: '#0f172a',
                              padding: '5px 12px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Xử lý
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 3: MY SHIPMENT (Mặc định chuẩn Ảnh 1)                 */
          /* ========================================================= */
          <div>
            {/* ── Main Tab Bar (Ảnh 1) ── */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '4px 4px 0 0',
                borderBottom: '1px solid #e8e8e8',
                display: 'flex',
                padding: '0 16px',
                gap: 28,
                overflowX: 'auto',
              }}
            >
              {MAIN_TABS.map((tab) => {
                const isActive = activeMainTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
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
                      transition: 'color 0.15s ease',
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

            {/* ── Filter Card (Ảnh 1) ── */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '20px 24px',
                border: '1px solid #e8e8e8',
                borderTop: 'none',
                marginBottom: 16,
              }}
            >
              {/* Row 1: Order Creation Date + Export */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#595959' }}>Order Creation Date</span>

                  {/* Interactive Date Picker Dropdown */}
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
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #e2e8f0',
                          padding: 6,
                          width: 220,
                          zIndex: 50,
                        }}
                      >
                        {[
                          { label: 'Hôm nay (Today)', val: '2026/10/10 — 2026/10/10' },
                          { label: '7 ngày qua (Last 7 days)', val: '2026/10/03 — 2026/10/10' },
                          { label: '30 ngày qua (Last 30 days)', val: '2026/09/10 — 2026/10/10' },
                          { label: 'Toàn bộ thời gian (All)', val: '2026/01/01 — 2026/10/10' },
                        ].map((item) => (
                          <div
                            key={item.val}
                            onClick={() => {
                              setDateRangeLabel(item.val)
                              setDatePickerOpen(false)
                              toast.info(`Đã áp dụng khoảng thời gian: ${item.label}`)
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

                {/* Export Button -> Downloads CSV */}
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

              {/* Row 2: Search Type Dropdown + Input + Search + Reset */}
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: 540 }}>
                  {/* Dropdown Order ID / Tracking No / Buyer Name */}
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

            {/* ── Sub-Tabs & Action Bar (Ảnh 1) ── */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '16px 20px',
                border: '1px solid #e8e8e8',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Sub-tabs: All | To Process | Processed */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'TO_PROCESS', label: 'To Process' },
                  { id: 'PROCESSED', label: 'Processed' },
                ].map((sub) => {
                  const isActive = activeSubTab === sub.id
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveSubTab(sub.id as any)}
                      style={{
                        backgroundColor: isActive ? '#fef3c7' : '#f5f5f5',
                        color: isActive ? '#b45309' : '#595959',
                        border: isActive ? '1px solid #fde68a' : '1px solid transparent',
                        padding: '5px 14px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {sub.label}
                    </button>
                  )
                })}
              </div>

              {/* Action buttons: 0 Orders, Sort by, Mass Upload IMEI/SN, Mass Ship */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#8c8c8c' }}>{filteredOrders.length} Orders</span>

                {/* Sort By Dropdown */}
                <div style={{ position: 'relative' }} ref={sortRef}>
                  <button
                    type="button"
                    onClick={() => setSortOpen(!sortOpen)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d9d9d9',
                      color: '#595959',
                      padding: '6px 14px',
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowUpDown style={{ width: 13, height: 13 }} />
                    <span>Sort by</span>
                  </button>

                  {sortOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 4,
                        backgroundColor: '#ffffff',
                        borderRadius: 6,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        padding: 4,
                        width: 190,
                        zIndex: 50,
                      }}
                    >
                      {[
                        { id: 'NEWEST', label: 'Mới nhất (Newest)' },
                        { id: 'OLDEST', label: 'Cũ nhất (Oldest)' },
                        { id: 'PRICE_HIGH', label: 'Giá cao đến thấp' },
                        { id: 'PRICE_LOW', label: 'Giá thấp đến cao' },
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSortOption(item.id as any)
                            setSortOpen(false)
                            toast.info(`Sắp xếp: ${item.label}`)
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: 12,
                            color: '#334155',
                            borderRadius: 4,
                            cursor: 'pointer',
                            backgroundColor: sortOption === item.id ? '#fef9c3' : 'transparent',
                            fontWeight: sortOption === item.id ? 700 : 400,
                          }}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mass Upload IMEI/SN Button -> Opens Modal */}
                <button
                  type="button"
                  style={{
                    backgroundColor: '#fefce8',
                    border: '1px solid #ca8a04',
                    color: '#854d0e',
                    padding: '6px 14px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload style={{ width: 13, height: 13 }} />
                  <span>Mass Upload IMEI/SN</span>
                </button>

                {/* Mass Ship Button -> Chuyển sang View Mass Ship */}
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'MASS_SHIP' })}
                  style={{
                    backgroundColor: '#facc15',
                    border: 'none',
                    color: '#0f172a',
                    padding: '6px 18px',
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
            </div>

            {/* ── Table Container (Ảnh 1) ── */}
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
                <div>Total Price</div>
                <div>Status</div>
                <div>Countdown</div>
                <div>All Channels</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>

              {/* Table Body */}
              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#8c8c8c' }}>
                  <div className="cart-spinner" style={{ width: 28, height: 28, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Loading shipment orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                /* Empty State (Ảnh 1) */
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
                    <Truck style={{ width: 28, height: 28 }} />
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>No Orders Found</div>
                </div>
              ) : (
                <div>
                  {filteredOrders.map((order) => (
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

                      {/* Total Price */}
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
                      <div style={{ color: '#595959', fontSize: 12 }}>2 days 14 hours</div>

                      {/* Channels */}
                      <div style={{ color: '#595959' }}>{order.carrier || 'Chicky Express'}</div>

                      {/* Actions */}
                      <div style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          style={{
                            backgroundColor: '#facc15',
                            border: 'none',
                            color: '#0f172a',
                            padding: '6px 14px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => toast.success(`Đã in phiếu giao hàng cho đơn ${order.orderCode}`)}
                        >
                          Giao hàng
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: MASS UPLOAD IMEI / SERIAL NUMBER                    */}
        {/* ========================================================= */}
        {isUploadModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                width: 520,
                maxWidth: '90vw',
                padding: 24,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Mass Upload IMEI / Serial Number
                </h3>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Tải lên tệp bảng tính danh sách số IMEI hoặc Serial Number cho các sản phẩm công nghệ / thiết bị trong các đơn hàng đã chọn.
              </div>

              {/* Template Download Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSpreadsheet style={{ width: 16, height: 16, color: '#16a34a' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Mẫu tệp IMEI_SN_Template.xlsx</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Đang tải về tệp biểu mẫu mẫu...')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ca8a04',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Tải mẫu về
                </button>
              </div>

              {/* File Dropzone */}
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '30px 20px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  marginBottom: 20,
                }}
              >
                <Upload style={{ width: 32, height: 32, color: '#94a3b8', marginBottom: 8 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  {uploadFileName ? uploadFileName : 'Nhấp để chọn tệp .xlsx hoặc .csv'}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Dung lượng tối đa 10MB</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadFileName(e.target.files[0].name)
                    }
                  }}
                />
              </label>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: 13,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!uploadFileName) {
                      toast.info('Vui lòng chọn tệp bảng tính trước khi tải lên.')
                      return
                    }
                    toast.success(`Đã xử lý tải lên thành công tệp ${uploadFileName}!`)
                    setIsUploadModalOpen(false)
                    setUploadFileName('')
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 4,
                    border: 'none',
                    backgroundColor: '#facc15',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#0f172a',
                  }}
                >
                  Tải lên & Xác thực
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerShipmentPage
