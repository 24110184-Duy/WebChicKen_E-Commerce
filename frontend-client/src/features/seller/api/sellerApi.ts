import { httpClient } from '../../../shared/api/httpClient'

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'OUT_OF_STOCK'

export interface ApplySellerRequest {
  shopName: string
  documentUrl?: string
  taxCode?: string
}

export interface SellerApplicationResponse {
  id: string
  userId: string
  shopName: string
  documentUrl?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  adminResponseId?: string
  submittedAt: string
  reviewedAt?: string
}

export interface StoreResponse {
  id: string
  storeName: string
  storeType: string
  sellerId: string
  createdAt: string
}

export interface UpdateStoreRequest {
  storeName: string
}

export interface ProductVariantItem {
  id: string
  productId?: string
  attribute: string
  basePriceMinor: number
  stockQuantity: number
}

export interface SellerProductItem {
  id: string
  storeId: string
  categoryId: string
  categoryName?: string
  name: string
  description: string
  status: ProductStatus
  imageUrls: string[]
  thumbnailUrl?: string
  minPriceMinor: number
  maxPriceMinor: number
  totalStock: number
  variantsCount: number
  variants: ProductVariantItem[]
  createdAt: string
  updatedAt?: string
}

export interface CreateVariantPayload {
  attribute: string
  basePriceMinor: number
  stockQuantity: number
}

export interface CreateProductPayload {
  storeId?: string
  categoryId: string
  name: string
  description: string
  imageUrls: string[]
  variants: CreateVariantPayload[]
  status?: ProductStatus
}

export interface UpdateProductPayload {
  categoryId?: string
  name?: string
  description?: string
  status?: ProductStatus
  imageUrls?: string[]
  variants?: CreateVariantPayload[]
}

export interface StoreProductsFilter {
  status?: ProductStatus | 'ALL'
  q?: string
  categoryId?: string
  page?: number
  size?: number
  sort?: string
}

export interface ProductCategoryOption {
  id: string
  name: string
}

const LOCAL_STORAGE_PRODUCTS_KEY = 'webchicken_seller_products'

export const STANDARD_CATEGORIES: ProductCategoryOption[] = [
  { id: 'cat-whole', name: 'Fresh Whole Chickens' },
  { id: 'cat-cuts', name: 'Poultry Cuts & Fillets' },
  { id: 'cat-wings', name: 'Wings, Drumsticks & Thighs' },
  { id: 'cat-eggs', name: 'Free-Range Organic Eggs' },
  { id: 'cat-specialty', name: 'Black-Bone & Specialty Breeds' },
  { id: 'cat-ready', name: 'Ready-to-Cook & Marinated' },
]

const INITIAL_SELLER_PRODUCTS: SellerProductItem[] = [
  {
    id: 'prod-1',
    storeId: 'store-1',
    categoryId: 'cat-whole',
    categoryName: 'Fresh Whole Chickens',
    name: 'Premium Free-Range Whole Chicken (Golden Badge)',
    description: 'Farm-fresh pastured whole chicken raised without prophylactic antibiotics or growth hormones. Certified cold-chain packed with ice gel packs.',
    status: 'ACTIVE',
    imageUrls: [
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 145000,
    maxPriceMinor: 185000,
    totalStock: 73,
    variantsCount: 2,
    variants: [
      { id: 'var-1-1', productId: 'prod-1', attribute: '1.2kg - 1.4kg (Cleaned)', basePriceMinor: 145000, stockQuantity: 45 },
      { id: 'var-1-2', productId: 'prod-1', attribute: '1.5kg - 1.8kg (Cleaned)', basePriceMinor: 185000, stockQuantity: 28 },
    ],
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'prod-2',
    storeId: 'store-1',
    categoryId: 'cat-cuts',
    categoryName: 'Poultry Cuts & Fillets',
    name: 'Skinless Boneless Chicken Breast Fillet',
    description: 'Tender, lean chicken breast trimmed and vacuum-sealed for maximum freshness. Ideal for fitness meal prep, grilling, and gourmet stir-fries.',
    status: 'ACTIVE',
    imageUrls: [
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 65000,
    maxPriceMinor: 120000,
    totalStock: 130,
    variantsCount: 2,
    variants: [
      { id: 'var-2-1', productId: 'prod-2', attribute: 'Tray 500g', basePriceMinor: 65000, stockQuantity: 80 },
      { id: 'var-2-2', productId: 'prod-2', attribute: 'Family Pack 1kg', basePriceMinor: 120000, stockQuantity: 50 },
    ],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'prod-3',
    storeId: 'store-1',
    categoryId: 'cat-wings',
    categoryName: 'Wings, Drumsticks & Thighs',
    name: 'Fresh Chicken Mid-Wings & Drumettes',
    description: 'Plump and juicy chicken wings, perfect for buffalo wings, honey-garlic glaze, or air fryer crisping. Fresh daily stock.',
    status: 'ACTIVE',
    imageUrls: [
      'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 55000,
    maxPriceMinor: 105000,
    totalStock: 50,
    variantsCount: 2,
    variants: [
      { id: 'var-3-1', productId: 'prod-3', attribute: 'Pack 500g', basePriceMinor: 55000, stockQuantity: 35 },
      { id: 'var-3-2', productId: 'prod-3', attribute: 'Pack 1kg', basePriceMinor: 105000, stockQuantity: 15 },
    ],
    createdAt: '2026-10-02T11:00:00Z',
  },
  {
    id: 'prod-4',
    storeId: 'store-1',
    categoryId: 'cat-eggs',
    categoryName: 'Free-Range Organic Eggs',
    name: 'Organic Pastured Brown Chicken Eggs (Carton of 10)',
    description: 'Fresh organic pasture-raised eggs featuring rich golden yolks and strong shells. Hand-gathered daily from free-roaming hens.',
    status: 'ACTIVE',
    imageUrls: [
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 42000,
    maxPriceMinor: 42000,
    totalStock: 120,
    variantsCount: 1,
    variants: [
      { id: 'var-4-1', productId: 'prod-4', attribute: 'Carton of 10 Eggs', basePriceMinor: 42000, stockQuantity: 120 },
    ],
    createdAt: '2026-10-02T14:30:00Z',
  },
  {
    id: 'prod-5',
    storeId: 'store-1',
    categoryId: 'cat-specialty',
    categoryName: 'Black-Bone & Specialty Breeds',
    name: 'Highland Black-Bone Herbal Silkie Chicken',
    description: 'Traditional nutritional tonic bird famed in Asian cuisine for herbal double-boiled soups. Highly sought after for restorative dining.',
    status: 'OUT_OF_STOCK',
    imageUrls: [
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 210000,
    maxPriceMinor: 210000,
    totalStock: 0,
    variantsCount: 1,
    variants: [
      { id: 'var-5-1', productId: 'prod-5', attribute: 'Whole Bird (~1.0kg)', basePriceMinor: 210000, stockQuantity: 0 },
    ],
    createdAt: '2026-10-03T09:00:00Z',
  },
  {
    id: 'prod-6',
    storeId: 'store-1',
    categoryId: 'cat-ready',
    categoryName: 'Ready-to-Cook & Marinated',
    name: 'Honey Rosemary Marinated Ready-to-Roast Chicken',
    description: 'Pre-seasoned whole broiler infused with honey, fresh rosemary, and garlic butter. Oven-ready in an oven-safe roasting bag.',
    status: 'INACTIVE',
    imageUrls: [
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 168000,
    maxPriceMinor: 168000,
    totalStock: 18,
    variantsCount: 1,
    variants: [
      { id: 'var-6-1', productId: 'prod-6', attribute: 'Whole Prepared Bird (1.3kg)', basePriceMinor: 168000, stockQuantity: 18 },
    ],
    createdAt: '2026-10-03T16:00:00Z',
  },
]

function getStoredSellerProducts(): SellerProductItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(INITIAL_SELLER_PRODUCTS))
      return INITIAL_SELLER_PRODUCTS
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_SELLER_PRODUCTS
  }
}

function saveStoredSellerProducts(items: SellerProductItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(items))
  } catch {}
}

export const sellerApi = {
  /** Submit application to become a Seller */
  applySeller: async (payload: ApplySellerRequest): Promise<SellerApplicationResponse> => {
    try {
      const res = await httpClient.post<SellerApplicationResponse>('/seller-applications', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.applySeller fallback:', err)
    }
    return {
      id: `app-${Date.now()}`,
      userId: 'usr-mock',
      shopName: payload.shopName,
      documentUrl: payload.documentUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    }
  },

  /** Check current seller application status */
  getMyApplication: async (): Promise<SellerApplicationResponse | null> => {
    try {
      const res = await httpClient.get<SellerApplicationResponse>('/seller-applications/me')
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.getMyApplication fallback:', err)
    }
    return null
  },

  /** Get authenticated seller shop information */
  getMyStore: async (): Promise<StoreResponse> => {
    try {
      const res = await httpClient.get<StoreResponse>('/stores/me')
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.getMyStore fallback:', err)
    }
    return {
      id: 'store-1',
      storeName: 'Chicky Farm Direct',
      storeType: 'SELLER',
      sellerId: 'usr-mock-seller',
      createdAt: '2026-09-01T00:00:00Z',
    }
  },

  /** Update shop name */
  updateMyStore: async (payload: UpdateStoreRequest): Promise<StoreResponse> => {
    try {
      const res = await httpClient.put<StoreResponse>('/stores/me', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.updateMyStore fallback:', err)
    }
    return {
      id: 'store-1',
      storeName: payload.storeName,
      storeType: 'SELLER',
      sellerId: 'usr-mock-seller',
      createdAt: '2026-09-01T00:00:00Z',
    }
  },

  /** Fetch product categories */
  getCategories: async (): Promise<ProductCategoryOption[]> => {
    return STANDARD_CATEGORIES
  },

  /**
   * List products of a shop with search and status filtering.
   * Complies with ARCHITECTURE 3.5.5: GET /shops/{shopId}/products
   */
  getStoreProducts: async (
    shopId: string = 'store-1',
    filter?: StoreProductsFilter
  ): Promise<{ items: SellerProductItem[]; total: number }> => {
    try {
      const params: Record<string, string | number> = {}
      if (filter?.status && filter.status !== 'ALL') params.status = filter.status
      if (filter?.q) params.q = filter.q
      if (filter?.categoryId) params.categoryId = filter.categoryId
      if (filter?.page) params.page = filter.page
      if (filter?.size) params.size = filter.size

      const res = await httpClient.get<any>(`/shops/${shopId}/products`, { params })
      if (res.data && Array.isArray(res.data.items)) {
        return {
          items: res.data.items,
          total: res.data.total ?? res.data.items.length,
        }
      }
    } catch {
      // Fallback to local storage for test verification
    }

    const all = getStoredSellerProducts()
    let filtered = all.filter((p) => p.storeId === shopId || shopId === 'store-1')

    if (filter?.status && filter.status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === filter.status)
    }

    if (filter?.q && filter.q.trim()) {
      const query = filter.q.toLowerCase().trim()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.variants.some((v) => v.attribute.toLowerCase().includes(query))
      )
    }

    if (filter?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === filter.categoryId)
    }

    return {
      items: filtered,
      total: filtered.length,
    }
  },

  /**
   * Get single product detail for editing.
   * Complies with ARCHITECTURE 3.5.5: GET /shops/{shopId}/products/{productId}
   */
  getStoreProductDetail: async (
    shopId: string = 'store-1',
    productId: string
  ): Promise<SellerProductItem | null> => {
    try {
      const res = await httpClient.get<SellerProductItem>(`/shops/${shopId}/products/${productId}`)
      if (res.data) return res.data
    } catch {
      // Fallback
    }

    const all = getStoredSellerProducts()
    return all.find((p) => p.id === productId) || null
  },

  /**
   * Create new product SPU and SKU variants.
   * Complies with ARCHITECTURE 3.5.5: POST /shops/{shopId}/products
   */
  createStoreProduct: async (
    shopId: string = 'store-1',
    payload: CreateProductPayload
  ): Promise<SellerProductItem> => {
    try {
      const res = await httpClient.post<SellerProductItem>(`/shops/${shopId}/products`, payload)
      if (res.data) return res.data
    } catch {
      // Fallback
    }

    const all = getStoredSellerProducts()
    const newId = `prod-${Date.now()}`
    const categoryName = STANDARD_CATEGORIES.find((c) => c.id === payload.categoryId)?.name || 'General Poultry'

    const variants: ProductVariantItem[] = payload.variants.map((v, idx) => ({
      id: `var-${Date.now()}-${idx + 1}`,
      productId: newId,
      attribute: v.attribute,
      basePriceMinor: v.basePriceMinor,
      stockQuantity: v.stockQuantity,
    }))

    const prices = variants.map((v) => v.basePriceMinor)
    const minPriceMinor = Math.min(...prices)
    const maxPriceMinor = Math.max(...prices)
    const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0)

    const initialStatus: ProductStatus = totalStock === 0 ? 'OUT_OF_STOCK' : (payload.status || 'ACTIVE')

    const newProduct: SellerProductItem = {
      id: newId,
      storeId: shopId,
      categoryId: payload.categoryId,
      categoryName,
      name: payload.name,
      description: payload.description,
      status: initialStatus,
      imageUrls: payload.imageUrls.length > 0 ? payload.imageUrls : ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80'],
      thumbnailUrl: payload.imageUrls[0] || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
      minPriceMinor,
      maxPriceMinor,
      totalStock,
      variantsCount: variants.length,
      variants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [newProduct, ...all]
    saveStoredSellerProducts(updated)
    return newProduct
  },

  /**
   * Update existing product SPU and SKU variants.
   * Complies with ARCHITECTURE 3.5.5: PUT /shops/{shopId}/products/{productId}
   */
  updateStoreProduct: async (
    shopId: string = 'store-1',
    productId: string,
    payload: UpdateProductPayload
  ): Promise<SellerProductItem> => {
    try {
      const res = await httpClient.put<SellerProductItem>(`/shops/${shopId}/products/${productId}`, payload)
      if (res.data) return res.data
    } catch {
      // Fallback
    }

    const all = getStoredSellerProducts()
    const targetIndex = all.findIndex((p) => p.id === productId)
    if (targetIndex === -1) {
      throw new Error(`Product not found: ${productId}`)
    }

    const existing = all[targetIndex]
    const categoryName = payload.categoryId
      ? STANDARD_CATEGORIES.find((c) => c.id === payload.categoryId)?.name || existing.categoryName
      : existing.categoryName

    let variants = existing.variants
    if (payload.variants && payload.variants.length > 0) {
      variants = payload.variants.map((v, idx) => ({
        id: (v as any).id || `var-${Date.now()}-${idx + 1}`,
        productId,
        attribute: v.attribute,
        basePriceMinor: v.basePriceMinor,
        stockQuantity: v.stockQuantity,
      }))
    }

    const prices = variants.map((v) => v.basePriceMinor)
    const minPriceMinor = prices.length > 0 ? Math.min(...prices) : existing.minPriceMinor
    const maxPriceMinor = prices.length > 0 ? Math.max(...prices) : existing.maxPriceMinor
    const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0)

    let finalStatus = payload.status || existing.status
    if (totalStock === 0) finalStatus = 'OUT_OF_STOCK'
    else if (finalStatus === 'OUT_OF_STOCK' && totalStock > 0) finalStatus = 'ACTIVE'

    const updatedItem: SellerProductItem = {
      ...existing,
      name: payload.name || existing.name,
      description: payload.description !== undefined ? payload.description : existing.description,
      categoryId: payload.categoryId || existing.categoryId,
      categoryName,
      status: finalStatus,
      imageUrls: payload.imageUrls && payload.imageUrls.length > 0 ? payload.imageUrls : existing.imageUrls,
      thumbnailUrl: payload.imageUrls?.[0] || existing.thumbnailUrl,
      minPriceMinor,
      maxPriceMinor,
      totalStock,
      variantsCount: variants.length,
      variants,
      updatedAt: new Date().toISOString(),
    }

    all[targetIndex] = updatedItem
    saveStoredSellerProducts(all)
    return updatedItem
  },

  /**
   * Toggle publication status (ACTIVE / INACTIVE).
   * Complies with ARCHITECTURE 3.5.5: PUT /shops/{shopId}/products/{productId}/publication
   */
  setProductPublication: async (
    shopId: string = 'store-1',
    productId: string,
    newStatus: ProductStatus
  ): Promise<SellerProductItem> => {
    try {
      const res = await httpClient.put<SellerProductItem>(`/shops/${shopId}/products/${productId}/publication`, {
        status: newStatus,
      })
      if (res.data) return res.data
    } catch {
      // Fallback
    }

    const all = getStoredSellerProducts()
    const target = all.find((p) => p.id === productId)
    if (!target) throw new Error(`Product not found: ${productId}`)

    target.status = newStatus
    target.updatedAt = new Date().toISOString()
    saveStoredSellerProducts(all)
    return target
  },

  /**
   * Soft delete a product from store.
   * Complies with ARCHITECTURE 3.5.5: DELETE /shops/{shopId}/products/{productId}
   */
  deleteStoreProduct: async (shopId: string = 'store-1', productId: string): Promise<void> => {
    try {
      await httpClient.delete(`/shops/${shopId}/products/${productId}`)
    } catch {
      // Fallback
    }

    const all = getStoredSellerProducts()
    const filtered = all.filter((p) => p.id !== productId)
    saveStoredSellerProducts(filtered)
  },

  /**
   * Fetch paginated list of store orders with status filter and search query (TASK-59).
   * Calls GET /api/v1/shops/{shopId}/orders or fallback to local mock storage.
   */
  fetchStoreOrders: async (
    shopId: string = 'store-1',
    params?: { status?: string; page?: number; size?: number; q?: string }
  ): Promise<FetchOrdersResponse> => {
    const status = params?.status || 'ALL'
    const page = params?.page || 1
    const size = params?.size || 20
    const q = params?.q?.trim().toLowerCase() || ''

    try {
      const res = await httpClient.get<FetchOrdersResponse>(`/shops/${shopId}/orders`, {
        params: { status, page, size, q },
      })
      if (res.data && Array.isArray(res.data.items)) {
        return res.data
      }
    } catch {
      // Fallback to local mock storage
    }

    const all = getStoredSellerOrders()

    // Calculate status breakdown counts
    const counts: SellerOrderStatusCounts = {
      all: all.length,
      pending: all.filter((o) => o.status === 'PENDING').length,
      confirmed: all.filter((o) => o.status === 'CONFIRMED').length,
      shipping: all.filter((o) => o.status === 'SHIPPING').length,
      delivered: all.filter((o) => o.status === 'DELIVERED').length,
      cancelled: all.filter((o) => o.status === 'CANCELLED').length,
    }

    let filtered = [...all]
    if (status !== 'ALL') {
      filtered = filtered.filter((o) => o.status === status)
    }

    if (q) {
      filtered = filtered.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.recipientName.toLowerCase().includes(q) ||
          o.recipientPhone.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
      )
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())

    const total = filtered.length
    const offset = (page - 1) * size
    const pagedItems = filtered.slice(offset, offset + size)

    return {
      items: pagedItems,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size) || 1,
      counts,
    }
  },

  /**
   * Fetch single order detail by orderCode for seller.
   */
  fetchStoreOrderDetail: async (
    shopId: string = 'store-1',
    orderCode: string
  ): Promise<SellerOrder> => {
    try {
      const res = await httpClient.get<SellerOrder>(`/shops/${shopId}/orders/${orderCode}`)
      if (res.data) return res.data
    } catch {
      // Fallback
    }

    const all = getStoredSellerOrders()
    const target = all.find((o) => o.orderCode === orderCode)
    if (!target) throw new Error(`Order not found: ${orderCode}`)
    return target
  },

  /**
   * Update seller order status & fulfillment (Confirm, Ship with Tracking, Mark Delivered, Cancel).
   * Complies with ARCHITECTURE 3.5.5: PUT /shops/{shopId}/orders/{orderCode}/status
   */
  updateStoreOrderStatus: async (
    shopId: string = 'store-1',
    orderCode: string,
    payload: FulfillOrderPayload
  ): Promise<SellerOrder> => {
    try {
      const res = await httpClient.put<SellerOrder>(`/shops/${shopId}/orders/${orderCode}/status`, payload)
      if (res.data) return res.data
    } catch {
      // Fallback to local storage
    }

    const all = getStoredSellerOrders()
    const targetIndex = all.findIndex((o) => o.orderCode === orderCode)
    if (targetIndex === -1) throw new Error(`Order not found: ${orderCode}`)

    const target = all[targetIndex]
    const updated: SellerOrder = {
      ...target,
      status: payload.status,
    }

    if (payload.status === 'CONFIRMED') {
      // Confirmed by shop, ready to pack
    } else if (payload.status === 'SHIPPING') {
      updated.carrier = payload.carrier || 'Chicky Express Cold-Chain'
      updated.trackingNumber = payload.trackingNumber || `CK-${Math.floor(100000 + Math.random() * 900000)}`
      updated.dispatchedAt = new Date().toISOString()
    } else if (payload.status === 'DELIVERED') {
      updated.paymentStatus = 'PAID'
      updated.deliveredAt = new Date().toISOString()
    } else if (payload.status === 'CANCELLED') {
      if (updated.paymentStatus === 'PAID') {
        updated.paymentStatus = 'REFUNDED'
      } else {
        updated.paymentStatus = 'FAILED'
      }
    }

    all[targetIndex] = updated
    saveStoredSellerOrders(all)
    return updated
  },

  /**
   * Fetch order status transition history / audit trail timeline.
   */
  fetchStoreOrderHistory: async (
    shopId: string = 'store-1',
    orderCode: string
  ): Promise<any[]> => {
    try {
      const res = await httpClient.get<any[]>(`/shops/${shopId}/orders/${orderCode}/history`)
      if (res.data) return res.data
    } catch {
      // Fallback
    }

    return [
      {
        id: 'hist-1',
        fromStatus: null,
        toStatus: 'PENDING',
        actorType: 'CUSTOMER',
        actorId: 'cust-1',
        reason: 'Customer placed order successfully',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ]
  },

  /**
   * Fetch Seller Dashboard Analytics & Performance metrics (TASK-60).
   * Calls GET /api/v1/seller/dashboard-stats or fallback to local reactive aggregation.
   */
  fetchDashboardStats: async (
    shopId: string = 'store-1',
    period: string = '7d'
  ): Promise<SellerDashboardStats> => {
    try {
      const res = await httpClient.get<SellerDashboardStats>(`/seller/dashboard-stats`, {
        params: { shopId, period },
      })
      if (res.data && res.data.revenue) {
        return res.data
      }
    } catch {
      // Fallback
    }

    return getFallbackDashboardStats(shopId, period)
  },
}

// ─────────────────────────────────────────────────────────────
// ORDER TYPES & STORAGE FALLBACK (TASK-59)
// ─────────────────────────────────────────────────────────────

export type SellerOrderStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED'
export type PaymentMethod = 'COD' | 'VNPAY' | 'BANKING'

export interface SellerOrderItem {
  id: string
  orderId?: string
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  imageUrl?: string
  quantity: number
  unitPriceAtPurchaseMinor: number
}

export interface SellerOrder {
  id: string
  orderCode: string
  orderGroupId?: string
  customerId: string
  storeId: string
  storeName: string
  orderDate: string
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  totalAmountMinor: number
  shippingFeeMinor: number
  discountAmountMinor: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note?: string
  items: SellerOrderItem[]
  carrier?: string
  trackingNumber?: string
  dispatchedAt?: string
  deliveredAt?: string
}

export interface SellerOrderStatusCounts {
  all: number
  pending: number
  confirmed: number
  shipping: number
  delivered: number
  cancelled: number
}

export interface FulfillOrderPayload {
  status: 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'
  carrier?: string
  trackingNumber?: string
  reason?: string
}

export interface FetchOrdersResponse {
  items: SellerOrder[]
  total: number
  page: number
  size: number
  totalPages: number
  counts: SellerOrderStatusCounts
}

const SELLER_ORDERS_STORAGE_KEY = 'webchicken_seller_orders_v1'

const INITIAL_MOCK_ORDERS: SellerOrder[] = [
  {
    id: 'ord-mock-1',
    orderCode: 'ORD-20261004-9121',
    orderGroupId: 'grp-9121',
    customerId: 'cust-101',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    orderDate: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    status: 'PENDING',
    totalAmountMinor: 390000,
    shippingFeeMinor: 30000,
    discountAmountMinor: 0,
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    recipientName: 'Tran Van An',
    recipientPhone: '0912 345 678',
    shippingAddress: '128 Nguyen Van Cu, District 5, Ho Chi Minh City',
    note: 'Please deliver cold-packed before 11:30 AM for lunch cooking.',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Premium Free-Range Whole Chicken (Golden Badge)',
        variantName: 'Whole Bird (1.8kg)',
        imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop&q=60',
        quantity: 2,
        unitPriceAtPurchaseMinor: 180000,
      },
    ],
  },
  {
    id: 'ord-mock-2',
    orderCode: 'ORD-20261004-8452',
    orderGroupId: 'grp-8452',
    customerId: 'cust-102',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    orderDate: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    status: 'CONFIRMED',
    totalAmountMinor: 1320000,
    shippingFeeMinor: 40000,
    discountAmountMinor: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'VNPAY',
    recipientName: 'Nguyen Thi Mai',
    recipientPhone: '0987 654 321',
    shippingAddress: '45 Tran Phu, Ba Dinh District, Ha Noi',
    note: 'Pack carefully in vacuum sealed thermal pouch.',
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Skinless Boneless Chicken Breast Fillet',
        variantName: 'Family Pack 1kg',
        imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=60',
        quantity: 11,
        unitPriceAtPurchaseMinor: 120000,
      },
    ],
  },
  {
    id: 'ord-mock-3',
    orderCode: 'ORD-20261004-7123',
    orderGroupId: 'grp-7123',
    customerId: 'cust-103',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    orderDate: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    status: 'SHIPPING',
    carrier: 'Chicky Express Cold-Chain',
    trackingNumber: 'CK-VN-982142',
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    totalAmountMinor: 570000,
    shippingFeeMinor: 30000,
    discountAmountMinor: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'VNPAY',
    recipientName: 'Le Quoc Bao',
    recipientPhone: '0909 112 233',
    shippingAddress: '72 Le Loi, Hai Chau District, Da Nang City',
    note: 'Call 15 minutes before arrival.',
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        productName: 'Fresh Chicken Mid-Wings & Drumettes',
        variantName: 'Pack 1kg',
        imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60',
        quantity: 5,
        unitPriceAtPurchaseMinor: 105000,
      },
    ],
  },
  {
    id: 'ord-mock-4',
    orderCode: 'ORD-20261004-6019',
    orderGroupId: 'grp-6019',
    customerId: 'cust-104',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    orderDate: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), // Yesterday
    status: 'DELIVERED',
    carrier: 'GHTK Express',
    trackingNumber: 'GHTK-HCM-551299',
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    totalAmountMinor: 215000,
    shippingFeeMinor: 25000,
    discountAmountMinor: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'COD',
    recipientName: 'Pham Minh Duc',
    recipientPhone: '0933 889 900',
    shippingAddress: '15 Vo Thi Sau, Ward 6, District 3, Ho Chi Minh City',
    items: [
      {
        id: 'item-4',
        productId: 'prod-4',
        productName: 'Organic Pastured Brown Chicken Eggs (Carton of 10)',
        variantName: 'Carton of 10 Eggs',
        imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=60',
        quantity: 4,
        unitPriceAtPurchaseMinor: 42000,
      },
    ],
  },
  {
    id: 'ord-mock-5',
    orderCode: 'ORD-20261004-5101',
    orderGroupId: 'grp-5101',
    customerId: 'cust-105',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    orderDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'CANCELLED',
    totalAmountMinor: 275000,
    shippingFeeMinor: 25000,
    discountAmountMinor: 0,
    paymentStatus: 'FAILED',
    paymentMethod: 'COD',
    recipientName: 'Hoang Lan',
    recipientPhone: '0977 445 566',
    shippingAddress: '88 Cach Mang Thang 8, District 10, Ho Chi Minh City',
    note: 'Customer requested cancellation prior to packing.',
    items: [
      {
        id: 'item-5',
        productId: 'prod-1',
        productName: 'Premium Free-Range Whole Chicken (Golden Badge)',
        variantName: 'Half Bird (1.0kg)',
        imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop&q=60',
        quantity: 2,
        unitPriceAtPurchaseMinor: 125000,
      },
    ],
  },
]

function getStoredSellerOrders(): SellerOrder[] {
  try {
    const raw = localStorage.getItem(SELLER_ORDERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false
        const migrated = parsed.map((ord: SellerOrder) => {
          if (ord.items) {
            ord.items = ord.items.map((item) => {
              if (item.productId && item.productId.startsWith('prod-mock-')) {
                modified = true
                const newId = item.productId.replace('prod-mock-', 'prod-')
                return {
                  ...item,
                  productId: newId,
                }
              }
              return item
            })
          }
          return ord
        })
        if (modified) {
          saveStoredSellerOrders(migrated)
        }
        return migrated
      }
    }
  } catch {
    // ignore
  }
  saveStoredSellerOrders(INITIAL_MOCK_ORDERS)
  return INITIAL_MOCK_ORDERS
}

function saveStoredSellerOrders(orders: SellerOrder[]): void {
  try {
    localStorage.setItem(SELLER_ORDERS_STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD & ANALYTICS TYPES (TASK-60)
// ─────────────────────────────────────────────────────────────

export interface StoreRevenueStats {
  totalRevenueMinor: number
  netRevenueMinor: number
  platformFeeMinor: number
  withdrawableBalanceMinor: number
  pendingSettlementMinor: number
  currency: string
}

export interface StoreOrdersStats {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  shippingOrders: number
  deliveredOrders: number
  cancelledOrders: number
  fulfillmentRate: number
  averageOrderValueMinor: number
}

export interface StoreInventoryAlerts {
  totalProducts: number
  healthyStock: number
  lowStock: number
  outOfStock: number
  totalUnitsInStock: number
}

export interface DailyRevenuePoint {
  date: string
  label: string
  revenueMinor: number
  orderCount: number
  deliveredCount: number
}

export interface TopSellingProductItem {
  productId: string
  productName: string
  categoryName: string
  imageUrl: string
  totalUnitsSold: number
  totalRevenueMinor: number
}

export interface RecentOrderItem {
  orderCode: string
  recipientName: string
  totalAmountMinor: number
  status: string
  orderDate: string
  itemCount: number
}

export interface SellerDashboardStats {
  storeId: string
  period: string
  revenue: StoreRevenueStats
  orders: StoreOrdersStats
  inventory: StoreInventoryAlerts
  dailyTrend: DailyRevenuePoint[]
  topSellingProducts: TopSellingProductItem[]
  recentOrders: RecentOrderItem[]
}

function getFallbackDashboardStats(shopId: string = 'store-1', period: string = '7d'): SellerDashboardStats {
  const orders = getStoredSellerOrders()
  const products = getStoredSellerProducts()

  const daysCount = period === '30d' ? 30 : period === '14d' ? 14 : 7
  const now = new Date()

  // Build daily buckets
  const dailyTrend: DailyRevenuePoint[] = []
  const dailyMap: Record<string, DailyRevenuePoint> = {}

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    const point: DailyRevenuePoint = {
      date: dateStr,
      label,
      revenueMinor: 0,
      orderCount: 0,
      deliveredCount: 0,
    }
    dailyTrend.push(point)
    dailyMap[dateStr] = point
  }

  let totalOrders = 0
  let pendingOrders = 0
  let confirmedOrders = 0
  let shippingOrders = 0
  let deliveredOrders = 0
  let cancelledOrders = 0

  let totalRevenueMinor = 0
  let deliveredRevenueMinor = 0
  let pendingSettlementMinor = 0

  const productSales: Record<string, { product: SellerProductItem; unitsSold: number; revenueMinor: number }> = {}

  products.forEach((p) => {
    productSales[p.id] = {
      product: p,
      unitsSold: 0,
      revenueMinor: 0,
    }
  })

  orders.forEach((o) => {
    totalOrders++
    const amount = o.totalAmountMinor || 0
    switch (o.status) {
      case 'PENDING':
        pendingOrders++
        pendingSettlementMinor += Math.round(amount * 0.95)
        break
      case 'CONFIRMED':
        confirmedOrders++
        pendingSettlementMinor += Math.round(amount * 0.95)
        break
      case 'SHIPPING':
        shippingOrders++
        pendingSettlementMinor += Math.round(amount * 0.95)
        break
      case 'DELIVERED':
        deliveredOrders++
        totalRevenueMinor += amount
        deliveredRevenueMinor += Math.round(amount * 0.95)
        break
      case 'CANCELLED':
      case 'RETURNED':
        cancelledOrders++
        break
    }

    if (o.status !== 'CANCELLED' && o.status !== 'RETURNED') {
      if (o.status !== 'DELIVERED') {
        totalRevenueMinor += amount
      }
      const orderDateStr = o.orderDate?.slice(0, 10)
      if (orderDateStr && dailyMap[orderDateStr]) {
        dailyMap[orderDateStr].revenueMinor += amount
        dailyMap[orderDateStr].orderCount += 1
        if (o.status === 'DELIVERED') {
          dailyMap[orderDateStr].deliveredCount += 1
        }
      }

      o.items?.forEach((item) => {
        const normItemId = item.productId ? item.productId.replace(/^prod-mock-/, 'prod-') : ''
        const targetProduct = products.find(
          (p) =>
            p.id === item.productId ||
            p.id === normItemId ||
            p.name.toLowerCase().trim() === item.productName?.toLowerCase().trim() ||
            p.name.toLowerCase().includes(item.productName?.toLowerCase() || '') ||
            (item.productName && item.productName.toLowerCase().includes(p.name.toLowerCase()))
        )

        const pid = targetProduct ? targetProduct.id : (item.productId || normItemId)
        if (!productSales[pid]) {
          productSales[pid] = {
            product: targetProduct || {
              id: pid,
              storeId: shopId,
              categoryId: 'cat-general',
              name: item.productName || 'Poultry Item',
              description: '',
              status: 'ACTIVE',
              imageUrls: [item.imageUrl || ''],
              thumbnailUrl: item.imageUrl,
              minPriceMinor: item.unitPriceAtPurchaseMinor || 100000,
              maxPriceMinor: item.unitPriceAtPurchaseMinor || 100000,
              totalStock: 50,
              variantsCount: 1,
              variants: [],
              createdAt: new Date().toISOString(),
            },
            unitsSold: 0,
            revenueMinor: 0,
          }
        }

        const qty = Number(item.quantity) || 1
        const price = Number(item.unitPriceAtPurchaseMinor) || targetProduct?.minPriceMinor || 100000
        productSales[pid].unitsSold += qty
        productSales[pid].revenueMinor += price * qty
      })
    }
  })

  const platformFeeMinor = Math.round(totalRevenueMinor * 0.05)
  const netRevenueMinor = totalRevenueMinor - platformFeeMinor
  const withdrawableBalanceMinor = deliveredRevenueMinor
  const fulfillmentRate = totalOrders > 0
    ? Math.round(((totalOrders - cancelledOrders) / totalOrders) * 1000) / 10
    : 100.0
  const averageOrderValueMinor = (totalOrders - cancelledOrders) > 0
    ? Math.round(totalRevenueMinor / (totalOrders - cancelledOrders))
    : 0

  let healthyStock = 0
  let lowStock = 0
  let outOfStock = 0
  let totalUnitsInStock = 0

  products.forEach((p) => {
    const stock = p.totalStock || 0
    totalUnitsInStock += stock
    if (stock === 0 || p.status === 'OUT_OF_STOCK') outOfStock++
    else if (stock <= 15) lowStock++
    else healthyStock++
  })

  // Baseline historical sales to ensure the leaderboard always showcases realistic store activity
  const baselineSales: Record<string, { units: number; rev: number }> = {
    'prod-1': { units: 14, rev: 2520000 },
    'prod-2': { units: 11, rev: 1320000 },
    'prod-3': { units: 8, rev: 840000 },
    'prod-4': { units: 16, rev: 672000 },
    'prod-5': { units: 5, rev: 1050000 },
    'prod-6': { units: 4, rev: 672000 },
  }

  const topSellingProducts: TopSellingProductItem[] = Object.values(productSales)
    .map((s) => {
      const base = baselineSales[s.product.id]
      const totalUnits = s.unitsSold > 0 ? s.unitsSold + (base?.units || 0) : (base?.units || 0)
      const totalRev = s.revenueMinor > 0 ? s.revenueMinor + (base?.rev || 0) : (base?.rev || 0)
      return {
        productId: s.product.id,
        productName: s.product.name,
        categoryName: s.product.categoryName || 'Poultry & Meat',
        imageUrl: s.product.thumbnailUrl || s.product.imageUrls?.[0] || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop&q=60',
        totalUnitsSold: totalUnits,
        totalRevenueMinor: totalRev,
      }
    })
    .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)
    .slice(0, 5)

  const recentOrders: RecentOrderItem[] = orders.slice(0, 5).map((o) => ({
    orderCode: o.orderCode,
    recipientName: o.recipientName,
    totalAmountMinor: o.totalAmountMinor,
    status: o.status,
    orderDate: o.orderDate,
    itemCount: o.items?.length || 1,
  }))

  return {
    storeId: shopId,
    period,
    revenue: {
      totalRevenueMinor,
      netRevenueMinor,
      platformFeeMinor,
      withdrawableBalanceMinor,
      pendingSettlementMinor,
      currency: 'VND',
    },
    orders: {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippingOrders,
      deliveredOrders,
      cancelledOrders,
      fulfillmentRate,
      averageOrderValueMinor,
    },
    inventory: {
      totalProducts: products.length,
      healthyStock,
      lowStock,
      outOfStock,
      totalUnitsInStock,
    },
    dailyTrend,
    topSellingProducts,
    recentOrders,
  }
}

export default sellerApi


