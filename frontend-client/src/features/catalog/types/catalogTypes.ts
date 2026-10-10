export interface Category {
  id: string
  name: string
  description?: string
  iconText?: string
  productCount?: number
}

export interface ProductVariant {
  id: string
  productId: string
  attribute: string // e.g. "500g", "1.0kg", "1.5kg" or "Original", "Spicy"
  basePriceMinor: number // in minor units (e.g. 150,000 VND = 15000000 or 150000)
  stockQuantity: number
}

export interface Product {
  id: string
  storeId: string
  storeName: string
  categoryId: string
  categoryName: string
  name: string
  description: string
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
  thumbnailUrl: string
  imageUrls: string[]
  variants: ProductVariant[]
  minPriceMinor: number
  maxPriceMinor: number
  totalStock: number
  rating: number
  ratingCount: number
  soldCount: number
  isFlashDeal?: boolean
  discountPercent?: number
  createdAt: string
}

export interface ProductFilter {
  query?: string
  categoryId?: string
  storeId?: string
  minPriceMinor?: number
  maxPriceMinor?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'top_rated' | 'popular'
  page?: number
  size?: number
}
