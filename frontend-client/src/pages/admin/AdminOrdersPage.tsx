import React, { useState, useEffect, useCallback } from 'react'
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
  MapPin
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import {
  adminOrderApi,
  type AdminOrder,
  type OrderStatusHistoryItem
} from '../../features/admin/api/adminOrderApi'

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)

  // Cancel Modal
  const [cancellingOrder, setCancellingOrder] = useState<AdminOrder | null>(null)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [submittingCancel, setSubmittingCancel] = useState<boolean>(false)

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

  const formatVnd = (minor: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minor || 0)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock style={{ width: 12, height: 12 }} /> Chờ xử lý
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 style={{ width: 12, height: 12 }} /> Đã xác nhận
          </span>
        )
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck style={{ width: 12, height: 12 }} /> Đang vận chuyển
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 style={{ width: 12, height: 12 }} /> Đã giao thành công
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle style={{ width: 12, height: 12 }} /> Đã hủy
          </span>
        )
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <RotateCcw style={{ width: 12, height: 12 }} /> Đã trả hàng
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      o.orderCode.toLowerCase().includes(q) ||
      (o.storeName && o.storeName.toLowerCase().includes(q)) ||
      (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q)) ||
      (o.customerId && o.customerId.toLowerCase().includes(q))
    )
  })

  // Thống kê nhanh
  const totalCount = orders.length
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const shippingCount = orders.filter((o) => o.status === 'SHIPPING').length
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.grandTotalMinor || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 500,
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag style={{ width: 24, height: 24, color: '#4f46e5' }} />
              <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng Toàn Sàn (Platform Orders Hub)</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Giám sát dòng đơn hàng toàn sàn, kiểm tra giao dịch liên shop, xử lý khiếu nại và can thiệp bảo vệ quyền lợi người mua.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw style={{ width: 15, height: 15 }} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Bento Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Toàn hệ sinh thái</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Layers style={{ width: 20, height: 20 }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Chờ xử lý</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
              <p className="text-xs text-amber-600 mt-0.5">Cần đóng gói</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock style={{ width: 20, height: 20 }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Đang giao hàng</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{shippingCount}</p>
              <p className="text-xs text-purple-600 mt-0.5">Đang trên đường</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Truck style={{ width: 20, height: 20 }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Giao thành công</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{deliveredCount}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Hoàn tất</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 style={{ width: 20, height: 20 }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh số toàn sàn</p>
              <p className="text-lg font-bold text-indigo-700 mt-1">{formatVnd(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Tổng giá trị đơn</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign style={{ width: 20, height: 20 }} />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PENDING', label: 'Chờ xử lý' },
              { key: 'CONFIRMED', label: 'Đã xác nhận' },
              { key: 'SHIPPING', label: 'Đang giao' },
              { key: 'DELIVERED', label: 'Đã giao' },
              { key: 'CANCELLED', label: 'Đã hủy' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search style={{ width: 18, height: 18, color: '#9ca3af', position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn hàng (ORD-...), tên gian hàng, địa chỉ nhận hàng..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw style={{ width: 32, height: 32, color: '#6366f1', margin: '0 auto' }} className="animate-spin mb-3" />
              <p className="text-sm text-gray-500">Đang tải danh sách đơn hàng toàn sàn...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingBag style={{ width: 40, height: 40, color: '#9ca3af', margin: '0 auto 12px' }} />
              <p className="text-base font-semibold text-gray-700">Không có đơn hàng nào khớp điều kiện</p>
              <p className="text-sm text-gray-500 mt-1">Vui lòng thử chọn trạng thái khác hoặc xóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã Đơn Hàng</th>
                    <th className="py-3.5 px-4">Gian Hàng / Cửa Hàng</th>
                    <th className="py-3.5 px-4">Ngày Đặt Hàng</th>
                    <th className="py-3.5 px-4">Thanh Toán</th>
                    <th className="py-3.5 px-4">Trạng Thái Đơn</th>
                    <th className="py-3.5 px-4">Tổng Tiền</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {order.orderCode}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          {order.items?.length || 0} sản phẩm
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          <Store style={{ width: 14, height: 14, color: '#6366f1' }} />
                          <span>{order.storeName || 'ChickyMart Shop'}</span>
                        </div>
                        <span className="text-xs text-gray-400 block truncate max-w-xs">
                          {order.shippingAddress || 'Địa chỉ tiêu chuẩn'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar style={{ width: 13, height: 13, color: '#9ca3af' }} />
                          <span>
                            {order.orderDate
                              ? new Date(order.orderDate).toLocaleString('vi-VN')
                              : 'Vừa xong'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <CreditCard style={{ width: 13, height: 13, color: '#6b7280' }} />
                          <span className="font-semibold">{order.paymentMethod}</span>
                        </div>
                        <span
                          className={`text-2xs font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 text-sm">
                          {formatVnd(order.grandTotalMinor)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openOrderDetail(order)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye style={{ width: 16, height: 16 }} />
                          </button>
                          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                            <button
                              onClick={() => {
                                setCancellingOrder(order)
                                setCancelReason('')
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Can thiệp hủy đơn hàng"
                            >
                              <XCircle style={{ width: 16, height: 16 }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                    {selectedOrder.orderCode}
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Store & Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                  <div>
                    <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Gian Hàng Cung Cấp
                    </span>
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <Store style={{ width: 15, height: 15, color: '#4f46e5' }} />
                      {selectedOrder.storeName || 'ChickyMart Official'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Địa Chỉ Nhận Hàng
                    </span>
                    <p className="text-gray-800 flex items-start gap-1">
                      <MapPin style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                      <span>{selectedOrder.shippingAddress || 'Không có địa chỉ cụ thể'}</span>
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3">Sản phẩm trong đơn hàng</h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-11 h-11 rounded-lg object-cover bg-gray-100 border border-gray-200"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                              {item.productName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900 block">{item.productName}</span>
                            {item.variantName && (
                              <span className="text-xs text-gray-500">Phân loại: {item.variantName}</span>
                            )}
                            <span className="text-xs text-gray-400 block">Số lượng: x{item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block">
                            {formatVnd(item.unitPriceMinor * item.quantity)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatVnd(item.unitPriceMinor)} / sp
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Tổng tiền hàng:</span>
                    <span>{formatVnd(selectedOrder.totalAmountMinor)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí giao vận:</span>
                    <span>+{formatVnd(selectedOrder.shippingFeeMinor)}</span>
                  </div>
                  {selectedOrder.discountAmountMinor > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Voucher giảm giá sàn/shop:</span>
                      <span>-{formatVnd(selectedOrder.discountAmountMinor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Tổng thanh toán:</span>
                    <span className="text-indigo-600">{formatVnd(selectedOrder.grandTotalMinor)}</span>
                  </div>
                </div>

                {/* Status Timeline History */}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3">Lịch sử chuyển đổi trạng thái</h4>
                  {loadingHistory ? (
                    <p className="text-xs text-gray-400">Đang tải lịch sử hành trình...</p>
                  ) : orderHistory.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Chưa có bản ghi lịch sử bổ sung.</p>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                      {orderHistory.map((h) => (
                        <div key={h.id} className="relative flex items-start gap-3 pl-6 text-xs">
                          <span className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                          <div>
                            <span className="font-semibold text-gray-900">
                              {h.fromStatus ? `${h.fromStatus} → ` : ''}
                              {h.toStatus}
                            </span>
                            <span className="text-gray-400 text-2xs block">
                              Bởi {h.actorType} • {new Date(h.createdAt).toLocaleString('vi-VN')}
                            </span>
                            {h.reason && <span className="text-gray-600 block mt-0.5 italic">"{h.reason}"</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Cancel Order Modal */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto">
                <XCircle style={{ width: 24, height: 24 }} />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">Can thiệp hủy đơn hàng</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Đơn hàng: <span className="font-mono font-bold text-indigo-600">{cancellingOrder.orderCode}</span>
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Thao tác này sẽ hoàn trả số lượng tồn kho và ghi nhận quyền can thiệp của Quản Trị Viên vào Audit Trail.
                </p>
              </div>

              <form onSubmit={handleAdminCancel} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Lý do can thiệp hủy đơn <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ví dụ: Người mua khiếu nại gian hàng gian lận, không đóng gói theo cam kết..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCancel}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingCancel && <RefreshCw style={{ width: 14, height: 14 }} className="animate-spin" />}
                    <span>Xác Nhận Hủy Đơn</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminOrdersPage
