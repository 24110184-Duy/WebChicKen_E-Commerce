export type DiscountType = 'PERCENTAGE' | 'AMOUNT'

export interface BackendCartItem {
  itemId: string
  productId: string
  variantId: string
  productName: string
  variantAttribute: string
  thumbnailUrl: string
  currentPriceMinor: number
  quantity: number
  availableStock: number
  itemTotalMinor: number
  isAvailable: boolean
  priceChanged: boolean
  storeId: string
  storeName: string
}

export interface BackendCartStoreGroup {
  storeId: string
  storeName: string
  items: BackendCartItem[]
  storeSubtotalMinor: number
}

export interface BackendCartResponse {
  cartId: string
  customerId: string
  storeGroups: BackendCartStoreGroup[]
  totalQuantity: number
  totalAmountMinor: number
  hasOutOfStockItems: boolean
  hasPriceChanges: boolean
}

export interface Voucher {
  voucherId: string
  code: string
  title: string
  description: string
  discountType: DiscountType
  discountValue: number // percentage (e.g. 10 for 10%) or minor unit (e.g. 50000)
  minOrderValueMinor: number
  maxDiscountMinor: number
  storeId?: string | null // null means platform-wide voucher
  startDate: string
  endDate: string
  isActive: boolean
}

export interface ShippingMethod {
  id: string
  name: string
  estimatedTime: string
  feeMinor: number
}

export const MOCK_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ship-standard',
    name: 'Standard Eco Shipping',
    estimatedTime: '1 - 2 business days',
    feeMinor: 20000,
  },
  {
    id: 'ship-express',
    name: 'Express Farm-to-Door 2H',
    estimatedTime: 'Within 2 hours (Cold Chain Guaranteed)',
    feeMinor: 40000,
  },
]

export const MOCK_VOUCHERS: Voucher[] = []
