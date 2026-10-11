export interface ChatMessage {
  id: string
  storeId: string
  customerId: string
  senderType: 'CUSTOMER' | 'SELLER'
  senderId: string
  content: string
  productId?: string
  productName?: string
  productImage?: string
  productPriceMinor?: number
  isRead: boolean
  createdAt: string
}

export interface ChatConversation {
  storeId: string
  storeName?: string
  customerId: string
  customerName?: string
  customerAvatar?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  lastSenderType?: 'CUSTOMER' | 'SELLER'
}

export interface SendChatMessagePayload {
  storeId: string
  content: string
  customerId?: string // Required if role=seller
  productId?: string
  productName?: string
  productImage?: string
  productPriceMinor?: number
  role?: 'customer' | 'seller'
}
