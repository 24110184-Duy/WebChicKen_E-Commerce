import { httpClient } from '../../../shared/api/httpClient'

// ── Types khớp với BE DTO ──────────────────────────────────────────────────

export interface UserProfileResponse {
  userId: string
  email: string
  fullName: string
  phone: string
  logoUrl?: string
  status: string
  tier: string
  loyaltyPoint: number
  roles: string[]
  // Các field mở rộng (đã thêm vào BE UpdateProfileRequest)
  gender?: string       // MALE | FEMALE | OTHER
  dateOfBirth?: string  // yyyy-MM-dd
}

export interface UpdateProfileRequest {
  fullName: string
  phone?: string
  logoUrl?: string
  gender?: string       // MALE | FEMALE | OTHER
  dateOfBirth?: string  // yyyy-MM-dd
  email?: string
}

export interface AddressResponse {
  addressId: string
  userId: string
  recipientName: string
  phone: string
  addressLine1: string
  district: string
  city: string
  isDefault: boolean
  createdAt?: string
}

export interface CreateAddressRequest {
  recipientName: string
  phone: string
  addressLine1: string
  district: string
  city: string
  isDefault: boolean   // Bắt buộc theo BE CreateAddressRequest
}

// ── API calls ──────────────────────────────────────────────────────────────

export const customerApi = {
  /** GET /api/v1/customers/profile */
  getProfile: async (): Promise<UserProfileResponse> => {
    try {
      const res = await httpClient.get<UserProfileResponse>('/customers/profile')
      if (res.data) return res.data
    } catch (err) {
      console.warn('[customerApi.getProfile] Error fetching profile:', err)
    }
    // Fallback nếu chưa kết nối backend
    return {
      userId: 'usr-current',
      email: '',
      fullName: '',
      phone: '',
      status: 'ACTIVE',
      tier: 'STANDARD',
      loyaltyPoint: 0,
      roles: ['CUSTOMER'],
    }
  },

  /** PUT /api/v1/customers/profile */
  updateProfile: async (payload: UpdateProfileRequest): Promise<UserProfileResponse> => {
    try {
      const res = await httpClient.put<UserProfileResponse>('/customers/profile', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('[customerApi.updateProfile] Error updating profile:', err)
    }
    // Fallback — trả lại payload như đã gửi
    return {
      userId: 'usr-current',
      email: payload.email || '',
      fullName: payload.fullName,
      phone: payload.phone || '',
      status: 'ACTIVE',
      tier: 'STANDARD',
      loyaltyPoint: 0,
      roles: ['CUSTOMER'],
      logoUrl: payload.logoUrl,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
    }
  },

  /** GET /api/v1/customers/addresses */
  getAddresses: async (): Promise<AddressResponse[]> => {
    try {
      const res = await httpClient.get<AddressResponse[]>('/customers/addresses')
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] customerApi.getAddresses — Backend offline:', err)
    }
    return []
  },

  /** POST /api/v1/customers/addresses */
  createAddress: async (payload: CreateAddressRequest): Promise<AddressResponse> => {
    try {
      const res = await httpClient.post<AddressResponse>('/customers/addresses', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('[Mock] customerApi.createAddress — Backend offline:', err)
    }
    // Mock fallback
    return {
      addressId: `addr-${Date.now()}`,
      userId: 'usr-mock',
      createdAt: new Date().toISOString(),
      ...payload,
    }
  },

  /** PUT /api/v1/customers/addresses/{addressId}/default */
  setDefaultAddress: async (addressId: string): Promise<void> => {
    try {
      await httpClient.put<void>(`/customers/addresses/${addressId}/default`, {})
    } catch (err) {
      console.warn('[Mock] customerApi.setDefaultAddress — Backend offline:', err)
    }
  },

  /** DELETE /api/v1/customers/addresses/{addressId} */
  deleteAddress: async (addressId: string): Promise<void> => {
    try {
      await httpClient.delete<void>(`/customers/addresses/${addressId}`)
    } catch (err) {
      console.warn('[Mock] customerApi.deleteAddress — Backend offline:', err)
    }
  },
}
