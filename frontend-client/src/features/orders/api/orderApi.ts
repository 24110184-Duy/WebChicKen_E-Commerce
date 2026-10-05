import { httpClient } from '../../../shared/api/httpClient'
import type { CheckoutRequest, CheckoutResponse, OrderResponse, OrderStatus } from '../types/orderTypes'

export const orderApi = {
  checkout: async (data: CheckoutRequest): Promise<CheckoutResponse | null> => {
    try {
      const res = await httpClient.post<CheckoutResponse>('/checkout', data)
      return res.data || null
    } catch {
      return null
    }
  },

  getOrders: async (status?: OrderStatus, page: number = 1, size: number = 20): Promise<OrderResponse[]> => {
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      params.append('page', page.toString())
      params.append('size', size.toString())

      const res = await httpClient.get<OrderResponse[]>(`/orders?${params.toString()}`)
      return res.data || []
    } catch {
      return []
    }
  },

  getOrderByCode: async (orderCode: string): Promise<OrderResponse | null> => {
    try {
      const res = await httpClient.get<OrderResponse>(`/orders/${orderCode}`)
      return res.data || null
    } catch {
      return null
    }
  },

  cancelOrder: async (orderCode: string, reason?: string): Promise<OrderResponse | null> => {
    try {
      const res = await httpClient.post<OrderResponse>(`/orders/${orderCode}/cancel`, {
        reason: reason || 'Customer requested order cancellation',
      })
      return res.data || null
    } catch {
      return null
    }
  },
}
