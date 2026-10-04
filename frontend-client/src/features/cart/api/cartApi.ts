import { httpClient } from '../../../shared/api/httpClient'
import type { BackendCartResponse } from '../types/cartTypes'

export const cartApi = {
  getCart: async (): Promise<BackendCartResponse | null> => {
    try {
      const res = await httpClient.get<BackendCartResponse>('/cart')
      return res.data
    } catch {
      return null
    }
  },

  addItem: async (productId: string, variantId?: string, quantity: number = 1): Promise<BackendCartResponse | null> => {
    try {
      const res = await httpClient.post<BackendCartResponse>('/cart', {
        productId,
        variantId,
        quantity,
      })
      return res.data
    } catch {
      return null
    }
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<BackendCartResponse | null> => {
    try {
      const res = await httpClient.put<BackendCartResponse>(`/cart/items/${itemId}`, {
        quantity,
      })
      return res.data
    } catch {
      return null
    }
  },

  removeItem: async (itemId: string): Promise<BackendCartResponse | null> => {
    try {
      const res = await httpClient.delete<BackendCartResponse>(`/cart/items/${itemId}`)
      return res.data
    } catch {
      return null
    }
  },

  clearCart: async (): Promise<boolean> => {
    try {
      await httpClient.delete('/cart')
      return true
    } catch {
      return false
    }
  },
}
