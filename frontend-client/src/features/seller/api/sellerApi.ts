import { httpClient } from '../../../shared/api/httpClient'

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

export const sellerApi = {
  /** Nộp đơn xin trở thành Người bán */
  applySeller: async (payload: ApplySellerRequest): Promise<SellerApplicationResponse> => {
    try {
      const res = await httpClient.post<SellerApplicationResponse>('/seller-applications', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.applySeller — Backend offline:', err)
    }
    // Mock fallback
    return {
      id: `app-${Date.now()}`,
      userId: 'usr-mock',
      shopName: payload.shopName,
      documentUrl: payload.documentUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    }
  },

  /** Tra cứu tình trạng hồ sơ đăng ký của tôi */
  getMyApplication: async (): Promise<SellerApplicationResponse | null> => {
    try {
      const res = await httpClient.get<SellerApplicationResponse>('/seller-applications/me')
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.getMyApplication — Backend offline:', err)
    }
    return null
  },

  /** Lấy thông tin gian hàng của tôi */
  getMyStore: async (): Promise<StoreResponse | null> => {
    try {
      const res = await httpClient.get<StoreResponse>('/stores/me')
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.getMyStore — Backend offline:', err)
    }
    return null
  },

  /** Cập nhật thông tin gian hàng */
  updateMyStore: async (payload: UpdateStoreRequest): Promise<StoreResponse> => {
    try {
      const res = await httpClient.put<StoreResponse>('/stores/me', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] sellerApi.updateMyStore — Backend offline:', err)
    }
    return {
      id: 'store-mock',
      storeName: payload.storeName,
      storeType: 'SELLER',
      sellerId: 'usr-mock',
      createdAt: new Date().toISOString(),
    }
  },
}
