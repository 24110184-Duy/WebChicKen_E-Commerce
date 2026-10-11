import { httpClient } from '../../../shared/api/httpClient'
import type { ChatMessage, ChatConversation, SendChatMessagePayload } from '../types/chatTypes'

export const chatApi = {
  /**
   * Lấy danh sách tin nhắn giữa một Store và một Customer
   */
  getMessages: async (storeId: string, customerId?: string, role: 'customer' | 'seller' = 'customer'): Promise<ChatMessage[]> => {
    try {
      const params = new URLSearchParams()
      params.append('storeId', storeId)
      if (customerId) params.append('customerId', customerId)
      params.append('role', role)

      const res = await httpClient.get<ChatMessage[]>(`/chat/messages?${params.toString()}`)
      return res.data || []
    } catch (err) {
      console.warn('Lỗi khi tải tin nhắn chat:', err)
      return []
    }
  },

  /**
   * Gửi một tin nhắn mới
   */
  sendMessage: async (payload: SendChatMessagePayload): Promise<ChatMessage | null> => {
    try {
      const role = payload.role || 'customer'
      const res = await httpClient.post<ChatMessage>(`/chat/messages?role=${role}`, {
        storeId: payload.storeId,
        customerId: payload.customerId,
        content: payload.content,
        productId: payload.productId,
        productName: payload.productName,
        productImage: payload.productImage,
        productPriceMinor: payload.productPriceMinor,
      })
      return res.data || null
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn chat:', err)
      throw err
    }
  },

  /**
   * Lấy danh sách tất cả các cuộc hội thoại
   */
  getConversations: async (role: 'customer' | 'seller' = 'customer', storeId?: string): Promise<ChatConversation[]> => {
    try {
      const params = new URLSearchParams()
      params.append('role', role)
      if (storeId) params.append('storeId', storeId)

      const res = await httpClient.get<ChatConversation[]>(`/chat/conversations?${params.toString()}`)
      return res.data || []
    } catch (err) {
      console.warn('Lỗi khi tải danh bạ hội thoại:', err)
      return []
    }
  },

  /**
   * Đánh dấu cuộc hội thoại là đã đọc
   */
  markAsRead: async (storeId: string, customerId?: string, role: 'customer' | 'seller' = 'customer'): Promise<boolean> => {
    try {
      const params = new URLSearchParams()
      params.append('storeId', storeId)
      if (customerId) params.append('customerId', customerId)
      params.append('role', role)

      await httpClient.put(`/chat/read?${params.toString()}`)
      return true
    } catch {
      return false
    }
  },

  /**
   * Lấy tổng số tin nhắn chưa đọc
   */
  getUnreadCount: async (role: 'customer' | 'seller' = 'customer', storeId?: string): Promise<number> => {
    try {
      const params = new URLSearchParams()
      params.append('role', role)
      if (storeId) params.append('storeId', storeId)

      const res = await httpClient.get<{ unreadCount: number }>(`/chat/unread-count?${params.toString()}`)
      return res.data?.unreadCount || 0
    } catch {
      return 0
    }
  },
}
