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
  rejectionReason?: string
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

export interface CancelOrderPayload {
  reason: string
}

export interface FetchOrdersResponse {
  items: SellerOrder[]
  total: number
  page: number
  size: number
  totalPages: number
  counts: SellerOrderStatusCounts
}

export interface OrderStatusHistoryEntry {
  id: string
  fromStatus: string | null
  toStatus: string
  actorType: string
  actorId: string
  reason: string
  createdAt: string
}

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

export const sellerApi = {
  /** Nộp đơn đăng ký trở thành Người bán */
  applySeller: async (payload: ApplySellerRequest): Promise<SellerApplicationResponse> => {
    const res = await httpClient.post<SellerApplicationResponse>('/seller-applications', payload)
    if (!res.data) throw new Error('Không nhận được phản hồi từ máy chủ.')
    return res.data
  },

  /** Kiểm tra trạng thái hồ sơ đăng ký người bán của tài khoản hiện tại */
  getMyApplication: async (): Promise<SellerApplicationResponse | null> => {
    try {
      const res = await httpClient.get<SellerApplicationResponse>('/seller-applications/me')
      return res.data || null
    } catch {
      return null
    }
  },

  /** Lấy thông tin gian hàng thực tế của người bán đã đăng nhập */
  getMyStore: async (): Promise<StoreResponse | null> => {
    try {
      const res = await httpClient.get<StoreResponse>('/stores/me')
      return res.data || null
    } catch {
      return null
    }
  },

  /** Cập nhật tên gian hàng */
  updateMyStore: async (payload: UpdateStoreRequest): Promise<StoreResponse> => {
    const res = await httpClient.put<StoreResponse>('/stores/me', payload)
    if (!res.data) throw new Error('Không thể cập nhật thông tin gian hàng.')
    return res.data
  },

  /** Lấy danh mục sản phẩm từ CSDL */
  getCategories: async (): Promise<ProductCategoryOption[]> => {
    try {
      const res = await httpClient.get<any[]>('/categories')
      if (res.data && Array.isArray(res.data)) {
        return res.data.map((c) => ({ id: c.id, name: c.name }))
      }
    } catch {
      // ignore
    }
    return []
  },

  /**
   * Lấy danh sách sản phẩm của gian hàng (GET /api/v1/shops/{shopId}/products)
   */
  getStoreProducts: async (
    shopId: string,
    filter?: StoreProductsFilter
  ): Promise<{ items: SellerProductItem[]; total: number }> => {
    if (!shopId) return { items: [], total: 0 }

    const params: Record<string, string | number> = {}
    if (filter?.status && filter.status !== 'ALL') params.status = filter.status
    if (filter?.q) params.q = filter.q
    if (filter?.categoryId) params.categoryId = filter.categoryId
    if (filter?.page) params.page = filter.page
    if (filter?.size) params.size = filter.size
    if (filter?.sort) params.sort = filter.sort

    const res = await httpClient.get<any>(`/shops/${shopId}/products`, { params })
    if (res.data && Array.isArray(res.data.items)) {
      return {
        items: res.data.items,
        total: res.data.total ?? res.data.items.length,
      }
    }
    return { items: [], total: 0 }
  },

  /**
   * Lấy chi tiết sản phẩm theo ID (GET /api/v1/shops/{shopId}/products/{productId})
   */
  getStoreProductDetail: async (
    shopId: string,
    productId: string
  ): Promise<SellerProductItem | null> => {
    if (!shopId || !productId) return null
    const res = await httpClient.get<SellerProductItem>(`/shops/${shopId}/products/${productId}`)
    return res.data || null
  },

  /** Tạo sản phẩm mới kèm các biến thể (POST /api/v1/shops/{shopId}/products) */
  createStoreProduct: async (
    shopId: string,
    payload: CreateProductPayload
  ): Promise<SellerProductItem> => {
    const res = await httpClient.post<SellerProductItem>(`/shops/${shopId}/products`, payload)
    if (!res.data) throw new Error('Không thể khởi tạo sản phẩm.')
    return res.data
  },

  /** Cập nhật sản phẩm (PUT /api/v1/shops/{shopId}/products/{productId}) */
  updateStoreProduct: async (
    shopId: string,
    productId: string,
    payload: UpdateProductPayload
  ): Promise<SellerProductItem> => {
    const res = await httpClient.put<SellerProductItem>(`/shops/${shopId}/products/${productId}`, payload)
    if (!res.data) throw new Error('Không thể cập nhật sản phẩm.')
    return res.data
  },

  /** Bật/tắt trạng thái đăng bán sản phẩm */
  setProductPublication: async (
    shopId: string,
    productId: string,
    status: ProductStatus
  ): Promise<SellerProductItem> => {
    const res = await httpClient.put<SellerProductItem>(
      `/shops/${shopId}/products/${productId}/publication`,
      { status }
    )
    if (!res.data) throw new Error('Không thể thay đổi trạng thái đăng bán.')
    return res.data
  },

  /** Xóa mềm sản phẩm (DELETE /api/v1/shops/{shopId}/products/{productId}) */
  deleteStoreProduct: async (shopId: string, productId: string): Promise<void> => {
    await httpClient.delete(`/shops/${shopId}/products/${productId}`)
  },

  /**
   * Lấy danh sách đơn hàng của gian hàng từ CSDL (GET /api/v1/seller/orders/{shopId})
   */
  fetchStoreOrders: async (
    shopId: string,
    params?: { status?: string; page?: number; size?: number; q?: string }
  ): Promise<FetchOrdersResponse> => {
    const defaultCounts: SellerOrderStatusCounts = {
      all: 0,
      pending: 0,
      confirmed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    }

    if (!shopId) {
      return { items: [], total: 0, page: 1, size: 20, totalPages: 0, counts: defaultCounts }
    }

    const status = params?.status || 'ALL'
    const page = params?.page || 1
    const size = params?.size || 20
    const q = params?.q?.trim() || ''

    try {
      const res = await httpClient.get<FetchOrdersResponse>(`/seller/orders/${shopId}`, {
        params: { status, page, size, q },
      })
      if (res.data && Array.isArray(res.data.items)) {
        return {
          items: res.data.items,
          total: res.data.total ?? res.data.items.length,
          page: res.data.page ?? page,
          size: res.data.size ?? size,
          totalPages: res.data.totalPages ?? Math.ceil((res.data.total ?? 0) / size),
          counts: res.data.counts ?? defaultCounts,
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách đơn hàng người bán từ CSDL:', err)
    }

    return {
      items: [],
      total: 0,
      page,
      size,
      totalPages: 0,
      counts: defaultCounts,
    }
  },

  /** Chi tiết đơn hàng */
  fetchStoreOrderDetail: async (
    shopId: string,
    orderCode: string
  ): Promise<SellerOrder | null> => {
    if (!shopId || !orderCode) return null
    try {
      const res = await httpClient.get<SellerOrder>(`/seller/orders/${shopId}/${orderCode}`)
      return res.data || null
    } catch {
      return null
    }
  },

  /** Cập nhật trạng thái fulfillment đơn hàng */
  updateStoreOrderStatus: async (
    shopId: string,
    orderCode: string,
    payload: FulfillOrderPayload | CancelOrderPayload
  ): Promise<SellerOrder> => {
    const res = await httpClient.post<SellerOrder>(`/seller/orders/${shopId}/${orderCode}`, payload)
    if (!res.data) throw new Error('Không thể cập nhật trạng thái đơn hàng.')
    return res.data
  },

  /** Lịch sử chuyển đổi trạng thái đơn hàng */
  getOrderStatusHistory: async (
    shopId: string,
    orderCode: string
  ): Promise<OrderStatusHistoryEntry[]> => {
    if (!shopId || !orderCode) return []
    try {
      const res = await httpClient.get<OrderStatusHistoryEntry[]>(
        `/seller/orders/${shopId}/${orderCode}/history`
      )
      return res.data || []
    } catch {
      return []
    }
  },

  /**
   * Thống kê hiệu suất kinh doanh từ CSDL (GET /api/v1/seller/dashboard-stats)
   */
  fetchDashboardStats: async (
    shopId: string,
    period: string = '7d'
  ): Promise<SellerDashboardStats> => {
    const zeroStats: SellerDashboardStats = {
      storeId: shopId,
      period,
      revenue: {
        totalRevenueMinor: 0,
        netRevenueMinor: 0,
        platformFeeMinor: 0,
        withdrawableBalanceMinor: 0,
        pendingSettlementMinor: 0,
        currency: 'VND',
      },
      orders: {
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        shippingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        fulfillmentRate: 0,
        averageOrderValueMinor: 0,
      },
      inventory: {
        totalProducts: 0,
        healthyStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalUnitsInStock: 0,
      },
      dailyTrend: [],
      topSellingProducts: [],
      recentOrders: [],
    }

    if (!shopId) return zeroStats

    try {
      const res = await httpClient.get<any>('/seller/dashboard-stats', {
        params: { shopId, period },
      })
      if (res.data && res.data.revenue) {
        const raw = res.data
        const inv = raw.inventory || raw.inventoryAlerts || {}
        return {
          storeId: raw.storeId || shopId,
          period: raw.period || period,
          revenue: raw.revenue,
          orders: raw.orders || raw.ordersSummary || zeroStats.orders,
          inventory: {
            totalProducts: inv.totalProducts ?? 0,
            healthyStock: inv.healthyStock ?? inv.healthyStockCount ?? 0,
            lowStock: inv.lowStock ?? inv.lowStockCount ?? 0,
            outOfStock: inv.outOfStock ?? inv.outOfStockCount ?? 0,
            totalUnitsInStock: inv.totalUnitsInStock ?? 0,
          },
          dailyTrend: (raw.dailyTrend || raw.dailyRevenue || []).map((p: any) => ({
            date: p.date,
            label: p.label || p.dayOfWeek || p.date,
            revenueMinor: p.revenueMinor || 0,
            orderCount: p.orderCount || 0,
            deliveredCount: p.deliveredCount || 0,
          })),
          topSellingProducts: (raw.topSellingProducts || []).map((p: any) => ({
            productId: p.productId,
            productName: p.productName,
            categoryName: p.categoryName || '',
            imageUrl: p.imageUrl || p.thumbnailUrl || '',
            totalUnitsSold: p.totalUnitsSold || p.unitsSold || 0,
            totalRevenueMinor: p.totalRevenueMinor || p.revenueMinor || 0,
          })),
          recentOrders: raw.recentOrders || [],
        }
      }
    } catch (err) {
      console.warn('Lỗi tải thống kê seller analytics từ CSDL:', err)
    }

    return zeroStats
  },
}
