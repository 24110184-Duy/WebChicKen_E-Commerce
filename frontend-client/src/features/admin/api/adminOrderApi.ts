import { httpClient } from '../../../shared/api/httpClient'

export interface AdminOrderItem {
  id: string
  productId: string
  productName: string
  variantName?: string
  imageUrl?: string
  quantity: number
  unitPriceMinor: number
  subtotalMinor?: number
}

export interface AdminOrder {
  id: string
  orderCode: string
  customerId: string
  storeId?: string
  storeName?: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmountMinor: number
  shippingFeeMinor: number
  discountAmountMinor: number
  grandTotalMinor: number
  shippingAddress?: string
  note?: string
  orderDate?: string
  createdAt?: string
  items: AdminOrderItem[]
}

export interface OrderStatusHistoryItem {
  id: string
  orderId: string
  fromStatus?: string
  toStatus: string
  actorType: string
  actorId?: string
  reason?: string
  createdAt: string
}

export const adminOrderApi = {
  /**
   * Lấy danh sách toàn bộ đơn hàng toàn sàn (GET /api/v1/admin/orders)
   */
  async getOrders(status?: string, page: number = 1, size: number = 50): Promise<AdminOrder[]> {
    try {
      const params: Record<string, any> = { page, size, scope: 'platform' }
      if (status && status !== 'ALL') {
        params.status = status
      }
      const response = await httpClient.get<AdminOrder[]>('/admin/orders', { params })
      if (response.data && Array.isArray(response.data)) {
        return response.data
      }
    } catch (err) {
      console.warn('Lỗi khi lấy danh sách đơn hàng toàn sàn từ server:', err)
    }
    return []
  },

  /**
   * Xem chi tiết đơn hàng (GET /api/v1/orders/{orderCode})
   */
  async getOrderDetail(orderCode: string): Promise<AdminOrder | null> {
    try {
      const response = await httpClient.get<AdminOrder>(`/orders/${orderCode}`)
      return response.data ?? null
    } catch (err) {
      console.warn(`Lỗi khi lấy chi tiết đơn hàng ${orderCode}:`, err)
      return null
    }
  },

  /**
   * Xem lịch sử hành trình đơn hàng (GET /api/v1/orders/{orderCode}/history)
   */
  async getOrderHistory(orderCode: string): Promise<OrderStatusHistoryItem[]> {
    try {
      const response = await httpClient.get<OrderStatusHistoryItem[]>(`/orders/${orderCode}/history`)
      return response.data ?? []
    } catch (err) {
      console.warn(`Lỗi khi lấy lịch sử đơn hàng ${orderCode}:`, err)
      return []
    }
  },

  /**
   * Quản trị viên can thiệp hủy đơn hàng (POST /api/v1/orders/{orderCode}/cancel)
   */
  async cancelOrder(orderCode: string, reason: string): Promise<AdminOrder> {
    const response = await httpClient.post<AdminOrder>(`/orders/${orderCode}/cancel`, { reason })
    if (!response.data) {
      throw new Error(`Hủy đơn hàng ${orderCode} không thành công.`)
    }
    return response.data
  },

  /**
   * Quản trị viên cập nhật trạng thái đơn hàng (POST /api/v1/orders/{orderCode}/status)
   */
  async updateStatus(orderCode: string, status: string, reason: string): Promise<AdminOrder> {
    const response = await httpClient.post<AdminOrder>(`/orders/${orderCode}/status`, {
      status,
      reason,
      actorType: 'ADMIN'
    })
    if (!response.data) {
      throw new Error(`Cập nhật trạng thái đơn ${orderCode} không thành công.`)
    }
    return response.data
  }
}
