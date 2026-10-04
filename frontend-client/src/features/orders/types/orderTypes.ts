export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED'
export type PaymentMethod = 'COD' | 'VNPAY' | 'BANKING'

export interface OrderItemResponse {
  id: string
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  imageUrl?: string
  quantity: number
  unitPriceMinor: number
  subtotalMinor: number
}

export interface OrderResponse {
  id: string
  orderCode: string
  orderGroupId: string
  customerId: string
  storeId?: string
  storeName?: string
  orderDate: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  totalAmountMinor: number
  shippingFeeMinor: number
  discountAmountMinor: number
  recipientName?: string
  recipientPhone?: string
  shippingAddress?: string
  note?: string
  items: OrderItemResponse[]
}

export interface CheckoutRequest {
  items: {
    productId: string
    variantId?: string
    quantity: number
  }[]
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  voucherCode?: string
  paymentMethod: PaymentMethod
  note?: string
}

export interface CheckoutResponse {
  orderGroupId: string
  totalAmountMinor: number
  totalShippingFeeMinor: number
  totalDiscountMinor: number
  grandTotalMinor: number
  orders: OrderResponse[]
}
