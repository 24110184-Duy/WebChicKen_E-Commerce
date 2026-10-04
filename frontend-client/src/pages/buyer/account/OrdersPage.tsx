import React, { useState, useEffect } from 'react'
import { AccountLayout } from '../../../layouts/AccountLayout'
import { orderApi } from '../../../features/orders/api/orderApi'
import type { OrderResponse, OrderStatus } from '../../../features/orders/types/orderTypes'
import { formatMoney } from '../../../shared/lib/formatMoney'

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'>('ALL')
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingCode, setCancellingCode] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)

  const TABS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ thanh toán / xác nhận' },
    { key: 'CONFIRMED', label: 'Đã xác nhận' },
    { key: 'SHIPPING', label: 'Đang giao hàng' },
    { key: 'DELIVERED', label: 'Đã giao' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ] as const

  const fetchOrders = async () => {
    setLoading(true)
    const statusParam = activeTab === 'ALL' ? undefined : (activeTab as OrderStatus)
    const list = await orderApi.getOrders(statusParam)
    setOrders(list)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const handleCancelOrder = async () => {
    if (!cancellingCode) return
    setIsSubmittingCancel(true)
    try {
      const res = await orderApi.cancelOrder(cancellingCode, cancelReason || 'Khách hàng yêu cầu hủy đơn')
      if (res) {
        setCancellingCode(null)
        setCancelReason('')
        fetchOrders()
      } else {
        alert('Không thể hủy đơn hàng vào lúc này. Vui lòng kiểm tra lại.')
      }
    } catch {
      alert('Đã xảy ra lỗi khi gửi yêu cầu hủy đơn.')
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Chờ xử lý</span>
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Đã xác nhận</span>
      case 'SHIPPING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">Đang giao</span>
      case 'DELIVERED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Đã giao thành công</span>
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Đã hủy</span>
      case 'RETURNED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">Đã hoàn trả</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <AccountLayout>
      <div className="account-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Tabs Bar */}
        <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #efefef', overflowX: 'auto' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '16px 12px',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? '#b45309' : '#64748b',
                borderBottom: activeTab === tab.key ? '3px solid #f59e0b' : '3px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-yellow-400 border-t-transparent mb-3" />
            <p style={{ fontSize: 14, color: '#64748b' }}>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📦</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Chưa có đơn hàng nào</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>Khi bạn đặt mua sản phẩm, lịch sử và tình trạng đơn hàng sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => {
              const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED'
              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Order Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                        🏪 {order.storeName || 'ChickyMart Shop'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                        #{order.orderCode}
                      </span>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          paddingBottom: '12px',
                          borderBottom: '1px dashed #f1f5f9',
                        }}
                      >
                        <img
                          src={item.imageUrl || '/placeholder-product.png'}
                          alt={item.productName}
                          style={{
                            width: '56px',
                            height: '56px',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', marginBottom: '2px' }}>
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p style={{ fontSize: '12px', color: '#64748b' }}>Phân loại: {item.variantName}</p>
                          )}
                          <p style={{ fontSize: '12px', color: '#94a3b8' }}>Số lượng: x{item.quantity}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 600, color: '#d97706', fontSize: '14px' }}>
                            {formatMoney(item.subtotalMinor || item.unitPriceMinor * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Actions */}
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <p>Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}</p>
                      {order.shippingAddress && <p>Giao tới: {order.shippingAddress}</p>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Thành tiền: </span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#b45309' }}>
                          {formatMoney(order.totalAmountMinor)}
                        </span>
                      </div>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancellingCode(order.orderCode)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            backgroundColor: '#fff',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cancellation Modal Dialog */}
        {cancellingCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Xác nhận hủy đơn hàng #{cancellingCode}</h3>
              <p className="text-sm text-gray-500">
                Toàn bộ mặt hàng trong đơn sẽ được hoàn trả lại kho tự động. Bạn có chắc chắn muốn hủy đơn này?
              </p>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Lý do hủy đơn</label>
                <textarea
                  rows={3}
                  placeholder="Vui lòng cho biết lý do hủy đơn (đổi ý, đặt nhầm sản phẩm...)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingCode(null)}
                  disabled={isSubmittingCancel}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isSubmittingCancel}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
export default OrdersPage
