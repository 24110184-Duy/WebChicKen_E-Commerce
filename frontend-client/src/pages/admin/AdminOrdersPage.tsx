import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  XCircle,
  RotateCcw,
  Eye,
  Store,
  CreditCard,
  DollarSign,
  Calendar,
  Layers,
  MapPin,
  Trash2,
  FolderTree,
  AlertTriangle,
  X,
  User
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import {
  adminOrderApi,
  type AdminOrder,
  type OrderStatusHistoryItem
} from '../../features/admin/api/adminOrderApi'
import { adminCategoryApi, type CategoryItem } from '../../features/admin/api/adminCategoryApi'
import { adminProductApi } from '../../features/admin/api/adminProductApi'
import { formatMoney as formatVnd } from '../../shared/lib/formatMoney'
import { resolveImageUrl, handleImageFallback } from '../../shared/utils/imageUrl'

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [shopFilter, setShopFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // External data for filters
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, { categoryId: string; categoryName: string }>>({})

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)

  // Cancel Modal
  const [cancellingOrder, setCancellingOrder] = useState<AdminOrder | null>(null)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [submittingCancel, setSubmittingCancel] = useState<boolean>(false)

  // Delete Order Modal
  const [deletingOrder, setDeletingOrder] = useState<AdminOrder | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminOrderApi.getOrders(statusFilter)
      setOrders(data)
    } catch (err: any) {
      console.error('Lỗi tải danh sách đơn hàng:', err)
      showToast('Không thể tải danh sách đơn hàng toàn sàn.', 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // Load auxiliary data for Category & Shop filters
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [cats, prods] = await Promise.allSettled([
          adminCategoryApi.getCategories(),
          adminProductApi.getProducts({ size: 100 })
        ])

        if (cats.status === 'fulfilled') {
          setCategories(cats.value)
        }

        if (prods.status === 'fulfilled' && prods.value.items) {
          const map: Record<string, { categoryId: string; categoryName: string }> = {}
          prods.value.items.forEach((p) => {
            if (p.id) {
              map[p.id] = {
                categoryId: p.categoryId || '',
                categoryName: p.categoryName || ''
              }
            }
          })
          setProductCategoryMap(map)
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh mục và sản phẩm cho bộ lọc:', err)
      }
    }

    loadFilterData()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const openOrderDetail = async (order: AdminOrder) => {
    setSelectedOrder(order)
    setOrderHistory([])
    try {
      setLoadingHistory(true)
      const history = await adminOrderApi.getOrderHistory(order.orderCode)
      setOrderHistory(history)
    } catch (err) {
      console.warn('Lỗi tải lịch sử đơn hàng:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAdminCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancellingOrder) return

    try {
      setSubmittingCancel(true)
      const reason = cancelReason.trim() || 'Quản trị viên can thiệp hủy đơn hàng vì khiếu nại'
      const updated = await adminOrderApi.cancelOrder(cancellingOrder.orderCode, reason)
      setOrders((prev) => prev.map((o) => (o.orderCode === updated.orderCode ? updated : o)))
      if (selectedOrder?.orderCode === updated.orderCode) {
        setSelectedOrder(updated)
      }
      showToast(`Đã can thiệp hủy đơn hàng [${updated.orderCode}] thành công.`, 'success')
      setCancellingOrder(null)
      setCancelReason('')
    } catch (err: any) {
      showToast('Lỗi khi hủy đơn hàng: ' + (err?.message || 'Không thành công'), 'error')
    } finally {
      setSubmittingCancel(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return

    try {
      setSubmittingDelete(true)
      await adminOrderApi.deleteOrder(deletingOrder.orderCode)
      setOrders((prev) => prev.filter((o) => o.orderCode !== deletingOrder.orderCode))
      if (selectedOrder?.orderCode === deletingOrder.orderCode) {
        setSelectedOrder(null)
      }
      showToast(`Đã xóa vĩnh viễn đơn hàng [${deletingOrder.orderCode}] khỏi hệ thống.`, 'success')
      setDeletingOrder(null)
    } catch (err: any) {
      showToast('Lỗi khi xóa đơn hàng: ' + (err?.message || 'Không thành công'), 'error')
    } finally {
      setSubmittingDelete(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="admin-ord-status-pill pending">
            <Clock style={{ width: 12, height: 12 }} /> Chờ xử lý
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="admin-ord-status-pill confirmed">
            <CheckCircle2 style={{ width: 12, height: 12 }} /> Đã xác nhận
          </span>
        )
      case 'SHIPPING':
        return (
          <span className="admin-ord-status-pill shipping">
            <Truck style={{ width: 12, height: 12 }} /> Đang vận chuyển
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="admin-ord-status-pill delivered">
            <CheckCircle2 style={{ width: 12, height: 12 }} /> Đã giao thành công
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="admin-ord-status-pill cancelled">
            <XCircle style={{ width: 12, height: 12 }} /> Đã hủy
          </span>
        )
      case 'RETURNED':
        return (
          <span className="admin-ord-status-pill returned">
            <RotateCcw style={{ width: 12, height: 12 }} /> Đã trả hàng
          </span>
        )
      default:
        return (
          <span className="admin-ord-status-pill">
            {status}
          </span>
        )
    }
  }

  // Danh sách các shop duy nhất từ các đơn hàng hiện có
  const uniqueShops = useMemo(() => {
    const map = new Map<string, string>()
    orders.forEach((o) => {
      const sName = o.storeName || 'ChickyMart Shop'
      const sId = o.storeId || sName
      map.set(sId, sName)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [orders])

  // Lọc đa tiêu chí: Trạng thái, Shop, Danh mục, Từ khóa tìm kiếm
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Trạng thái
      if (statusFilter !== 'ALL' && o.status !== statusFilter) {
        return false
      }

      // 2. Lọc theo Gian hàng / Shop
      if (shopFilter !== 'ALL') {
        const orderShop = o.storeName || 'ChickyMart Shop'
        const orderShopId = o.storeId || ''
        if (orderShop !== shopFilter && orderShopId !== shopFilter) {
          return false
        }
      }

      // 3. Lọc theo Danh mục sản phẩm (Category)
      if (categoryFilter !== 'ALL') {
        const matchesCategory = o.items?.some((item) => {
          const productInfo = productCategoryMap[item.productId]
          if (productInfo) {
            return (
              productInfo.categoryId === categoryFilter ||
              productInfo.categoryName.toLowerCase() === categoryFilter.toLowerCase()
            )
          }
          return false
        })
        if (!matchesCategory) {
          return false
        }
      }

      // 4. Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchCode = o.orderCode.toLowerCase().includes(q)
        const matchStore = (o.storeName || '').toLowerCase().includes(q)
        const matchAddress = (o.shippingAddress || '').toLowerCase().includes(q)
        const matchCustomer = (o.customerId || '').toLowerCase().includes(q)
        const matchItems = o.items?.some((i) => i.productName.toLowerCase().includes(q))
        return matchCode || matchStore || matchAddress || matchCustomer || matchItems
      }

      return true
    })
  }, [orders, statusFilter, shopFilter, categoryFilter, searchQuery, productCategoryMap])

  // Thống kê nhanh
  const totalCount = orders.length
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const shippingCount = orders.filter((o) => o.status === 'SHIPPING').length
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.grandTotalMinor || 0), 0)

  const isFilterActive = shopFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery.trim() !== ''

  const handleResetFilters = () => {
    setShopFilter('ALL')
    setCategoryFilter('ALL')
    setSearchQuery('')
    setStatusFilter('ALL')
  }

  return (
    <AdminLayout>
      <div className="admin-mod-container">
        {/* Toast */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 99999,
              padding: '12px 20px',
              borderRadius: 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: toastMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${toastMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981' }} />
            ) : (
              <AlertCircle style={{ width: 18, height: 18, color: '#ef4444' }} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="admin-mod-header">
          <div className="admin-mod-header-left">
            <div className="admin-mod-icon-box">
              <ShoppingBag size={24} />
            </div>
            <div className="admin-mod-title-text">
              <h1>Quản Lý Đơn Hàng Toàn Sàn (Platform Orders Hub)</h1>
              <p>Giám sát dòng đơn hàng toàn sàn, kiểm tra giao dịch liên shop, xử lý khiếu nại và can thiệp bảo vệ quyền lợi người mua.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="cat-btn-secondary"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Bento Metrics Cards */}
        <div className="admin-ord-bento-grid">
          <div className="admin-ord-bento-card theme-indigo">
            <div className="admin-ord-bento-meta">
              <span className="admin-ord-bento-label">Tổng đơn hàng</span>
              <span className="admin-ord-bento-value">{totalCount}</span>
              <span className="admin-ord-bento-sub">Toàn hệ sinh thái</span>
            </div>
            <div className="admin-ord-bento-icon">
              <Layers size={22} />
            </div>
          </div>

          <div className="admin-ord-bento-card theme-amber">
            <div className="admin-ord-bento-meta">
              <span className="admin-ord-bento-label">Chờ xử lý</span>
              <span className="admin-ord-bento-value" style={{ color: '#d97706' }}>{pendingCount}</span>
              <span className="admin-ord-bento-sub">Cần đóng gói</span>
            </div>
            <div className="admin-ord-bento-icon">
              <Clock size={22} />
            </div>
          </div>

          <div className="admin-ord-bento-card theme-purple">
            <div className="admin-ord-bento-meta">
              <span className="admin-ord-bento-label">Đang giao hàng</span>
              <span className="admin-ord-bento-value" style={{ color: '#7c3aed' }}>{shippingCount}</span>
              <span className="admin-ord-bento-sub">Đang trên đường</span>
            </div>
            <div className="admin-ord-bento-icon">
              <Truck size={22} />
            </div>
          </div>

          <div className="admin-ord-bento-card theme-emerald">
            <div className="admin-ord-bento-meta">
              <span className="admin-ord-bento-label">Giao thành công</span>
              <span className="admin-ord-bento-value" style={{ color: '#059669' }}>{deliveredCount}</span>
              <span className="admin-ord-bento-sub">Hoàn tất</span>
            </div>
            <div className="admin-ord-bento-icon">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="admin-ord-bento-card theme-indigo">
            <div className="admin-ord-bento-meta">
              <span className="admin-ord-bento-label">Doanh số toàn sàn</span>
              <span className="admin-ord-bento-value" style={{ fontSize: 18, color: '#4f46e5' }}>
                {formatVnd(totalRevenue)}
              </span>
              <span className="admin-ord-bento-sub">Tổng giá trị đơn</span>
            </div>
            <div className="admin-ord-bento-icon">
              <DollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Advanced Filter Toolbar */}
        <div className="admin-ord-toolbar-card">
          {/* Row 1: Status Filter Tabs */}
          <div className="admin-ord-tabs-row">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PENDING', label: 'Chờ xử lý' },
              { key: 'CONFIRMED', label: 'Đã xác nhận' },
              { key: 'SHIPPING', label: 'Đang giao' },
              { key: 'DELIVERED', label: 'Đã giao' },
              { key: 'CANCELLED', label: 'Đã hủy' }
            ].map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`admin-ord-tab-btn ${statusFilter === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Row 2: Search & Dropdown Filters (Category & Shop) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            {/* Search Input */}
            <div className="admin-ord-search-box" style={{ flex: '1 1 300px' }}>
              <Search size={18} className="admin-ord-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã đơn hàng (ORD-...), tên gian hàng, địa chỉ, người nhận..."
                className="admin-ord-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Shop Filter Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0 12px',
                height: 42,
                minWidth: 200,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <Store size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
              <select
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#334155',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">Tất cả gian hàng ({uniqueShops.length})</option>
                {uniqueShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0 12px',
                height: 42,
                minWidth: 200,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <FolderTree size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#334155',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">Tất cả danh mục ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 42,
                  padding: '0 14px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Khôi phục tất cả bộ lọc về mặc định"
              >
                <RotateCcw size={14} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-ord-table-card">
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <RefreshCw style={{ width: 32, height: 32, color: '#6366f1', margin: '0 auto 12px' }} className="animate-spin" />
              <p style={{ fontSize: 14, color: '#64748b' }}>Đang tải danh sách đơn hàng toàn sàn...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <ShoppingBag style={{ width: 44, height: 44, color: '#94a3b8', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>Không có đơn hàng nào khớp điều kiện</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Vui lòng thử chọn trạng thái khác hoặc xóa tìm kiếm.</p>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    marginTop: 14,
                    padding: '8px 16px',
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Xóa toàn bộ bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="admin-ord-table">
                <thead>
                  <tr>
                    <th>Mã Đơn Hàng</th>
                    <th>Gian Hàng / Cửa Hàng</th>
                    <th>Ngày Đặt Hàng</th>
                    <th>Thanh Toán</th>
                    <th>Trạng Thái Đơn</th>
                    <th>Tổng Tiền</th>
                    <th className="text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => openOrderDetail(order)}
                          className="admin-ord-code-badge"
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'inline-block'
                          }}
                          title="Bấm để xem chi tiết đơn hàng"
                        >
                          {order.orderCode}
                        </button>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                          {order.items?.length || 0} sản phẩm
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#1e293b' }}>
                          <Store style={{ width: 14, height: 14, color: '#6366f1', flexShrink: 0 }} />
                          <span>{order.storeName || 'ChickyMart Shop'}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginTop: 2, maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.shippingAddress || 'Địa chỉ tiêu chuẩn'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar style={{ width: 13, height: 13, color: '#94a3b8' }} />
                          <span>
                            {order.orderDate
                              ? new Date(order.orderDate).toLocaleString('vi-VN')
                              : 'Vừa xong'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
                          <CreditCard style={{ width: 13, height: 13, color: '#6b7280' }} />
                          <span style={{ fontWeight: 600 }}>{order.paymentMethod}</span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            marginTop: 4,
                            display: 'inline-block',
                            backgroundColor: order.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                            color: order.paymentStatus === 'PAID' ? '#047857' : '#b45309',
                            border: order.paymentStatus === 'PAID' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                          }}
                        >
                          {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                          {formatVnd(order.grandTotalMinor)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {/* Nút Xem chi tiết đơn hàng */}
                          <button
                            type="button"
                            onClick={() => openOrderDetail(order)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: '1px solid #e0e7ff',
                              backgroundColor: '#eef2ff',
                              color: '#4f46e5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye style={{ width: 16, height: 16 }} />
                          </button>

                          {/* Nút Can thiệp hủy đơn (nếu chưa hủy / giao xong) */}
                          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingOrder(order)
                                setCancelReason('')
                              }}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: '1px solid #fed7aa',
                                backgroundColor: '#fff7ed',
                                color: '#ea580c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Can thiệp hủy đơn hàng"
                            >
                              <XCircle style={{ width: 16, height: 16 }} />
                            </button>
                          )}

                          {/* Nút Xóa đơn hàng (Admin Delete) */}
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(order)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: '1px solid #fecaca',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Xóa đơn hàng này khỏi hệ thống"
                          >
                            <Trash2 style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 1. MODAL XEM CHI TIẾT ĐƠN HÀNG (ORDER DETAIL MODAL) ── */}
        {selectedOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setSelectedOrder(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                maxWidth: 840,
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #1e293b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShoppingBag size={20} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                        {selectedOrder.orderCode}
                      </span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Đặt lúc: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString('vi-VN') : 'Gần đây'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Đóng cửa sổ"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 2-Column Info Grid: Gian Hàng & Giao Nhận */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16
                  }}
                >
                  {/* Shop Info */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Gian Hàng Cung Cấp
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Store size={18} color="#4f46e5" />
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        {selectedOrder.storeName || 'ChickyMart Official'}
                      </span>
                    </div>
                    {selectedOrder.storeId && (
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
                        Store ID: {selectedOrder.storeId}
                      </div>
                    )}
                  </div>

                  {/* Shipping & Recipient Info */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Thông Tin Nhận Hàng
                    </span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6 }}>
                      <MapPin size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.4 }}>
                        {selectedOrder.shippingAddress || 'Địa chỉ tiêu chuẩn hệ sinh thái'}
                      </div>
                    </div>
                    {selectedOrder.customerId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#64748b' }}>
                        <User size={13} />
                        <span>Mã người mua: {selectedOrder.customerId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
                    Sản phẩm trong đơn hàng ({selectedOrder.items?.length || 0})
                  </h4>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            borderBottom: idx < (selectedOrder.items?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {item.imageUrl ? (
                              <img
                                src={resolveImageUrl(item.imageUrl)}
                                alt={item.productName}
                                onError={handleImageFallback}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 8,
                                  objectFit: 'cover',
                                  border: '1px solid #e2e8f0',
                                  backgroundColor: '#f8fafc'
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 8,
                                  backgroundColor: '#eef2ff',
                                  color: '#4f46e5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: 16
                                }}
                              >
                                {item.productName ? item.productName.charAt(0).toUpperCase() : 'P'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                                {item.productName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: '#64748b' }}>
                                {item.variantName && <span>Phân loại: <b>{item.variantName}</b></span>}
                                <span>Số lượng: <b>x{item.quantity}</b></span>
                                {productCategoryMap[item.productId]?.categoryName && (
                                  <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                                    {productCategoryMap[item.productId].categoryName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                              {formatVnd(item.subtotalMinor || item.unitPriceMinor * item.quantity)}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                              {formatVnd(item.unitPriceMinor)} / sp
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                        Không có chi tiết mặt hàng
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary & Payment */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                    padding: 16,
                    backgroundColor: '#f8fafc',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {/* Payment Details */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Phương Thức Thanh Toán
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                      <CreditCard size={18} color="#6366f1" />
                      <span>{selectedOrder.paymentMethod || 'COD'}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: selectedOrder.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                          color: selectedOrder.paymentStatus === 'PAID' ? '#047857' : '#b45309',
                          border: selectedOrder.paymentStatus === 'PAID' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                        }}
                      >
                        {selectedOrder.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                      </span>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Tổng tiền hàng:</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatVnd(selectedOrder.totalAmountMinor)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Phí vận chuyển:</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>+{formatVnd(selectedOrder.shippingFeeMinor)}</span>
                    </div>
                    {selectedOrder.discountAmountMinor > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                        <span>Giảm giá Voucher:</span>
                        <span>-{formatVnd(selectedOrder.discountAmountMinor)}</span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: 8,
                        marginTop: 4,
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#0f172a'
                      }}
                    >
                      <span>Tổng thanh toán:</span>
                      <span style={{ color: '#4f46e5' }}>{formatVnd(selectedOrder.grandTotalMinor)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Timeline History */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
                    Lịch sử hành trình trạng thái (Audit Trail)
                  </h4>
                  {loadingHistory ? (
                    <div style={{ padding: 16, fontSize: 13, color: '#94a3b8' }}>
                      Đang tải lịch sử hành trình...
                    </div>
                  ) : orderHistory.length === 0 ? (
                    <div style={{ padding: 14, fontSize: 13, color: '#94a3b8', fontStyle: 'italic', backgroundColor: '#f8fafc', borderRadius: 8 }}>
                      Đơn hàng chưa có thêm mốc chuyển đổi trạng thái nào khác.
                    </div>
                  ) : (
                    <div
                      style={{
                        borderLeft: '2px solid #e2e8f0',
                        marginLeft: 10,
                        paddingLeft: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14
                      }}
                    >
                      {orderHistory.map((h) => (
                        <div key={h.id} style={{ position: 'relative' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: -24,
                              top: 2,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: '#4f46e5',
                              border: '2px solid #ffffff'
                            }}
                          />
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {h.fromStatus ? `${h.fromStatus} → ` : ''}
                            {h.toStatus}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                            Bởi {h.actorType} {h.actorId ? `(${h.actorId})` : ''} •{' '}
                            {new Date(h.createdAt).toLocaleString('vi-VN')}
                          </div>
                          {h.reason && (
                            <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 3 }}>
                              "{h.reason}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Nút Xóa Đơn Hàng trong Modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingOrder(selectedOrder)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#dc2626',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Xóa đơn hàng</span>
                  </button>

                  {/* Nút Can thiệp Hủy Đơn */}
                  {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancellingOrder(selectedOrder)
                        setCancelReason('')
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#ea580c',
                        backgroundColor: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <XCircle size={15} />
                      <span>Can thiệp hủy đơn</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. MODAL CAN THIỆP HỦY ĐƠN HÀNG (CANCEL ORDER MODAL) ── */}
        {cancellingOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setCancellingOrder(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                maxWidth: 480,
                width: '100%',
                padding: 24,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
              >
                <XCircle size={26} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Can thiệp hủy đơn hàng
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Đơn hàng: <b style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{cancellingOrder.orderCode}</b>
                </p>
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
                  Hành động này sẽ giải phóng tồn kho đã giữ và ghi nhận lịch sử can thiệp vào Audit Trail.
                </p>
              </div>

              <form onSubmit={handleAdminCancel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Lý do can thiệp hủy đơn <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ví dụ: Người mua khiếu nại gian hàng gian lận, không đóng gói theo cam kết..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCancel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: submittingCancel ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submittingCancel && <RefreshCw size={14} className="animate-spin" />}
                    <span>Xác Nhận Hủy Đơn</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 3. MODAL XÁC NHẬN XÓA ĐƠN HÀNG (DELETE ORDER MODAL) ── */}
        {deletingOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setDeletingOrder(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                maxWidth: 440,
                width: '100%',
                padding: 24,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Xác nhận xóa vĩnh viễn đơn hàng
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Bạn có chắc chắn muốn xóa đơn hàng{' '}
                  <b style={{ fontFamily: 'monospace', color: '#dc2626' }}>{deletingOrder.orderCode}</b> khỏi hệ sinh thái?
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10, lineHeight: 1.4 }}>
                  Hành động này sẽ xóa dữ liệu đơn hàng và lịch sử liên quan khỏi cơ sở dữ liệu. Thao tác này không thể hoàn tác.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setDeletingOrder(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submittingDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 20px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submittingDelete ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submittingDelete && <RefreshCw size={14} className="animate-spin" />}
                  <span>Xóa Đơn Hàng</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminOrdersPage
