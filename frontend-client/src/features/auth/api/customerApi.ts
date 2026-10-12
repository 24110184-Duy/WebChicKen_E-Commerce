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
    const res = await httpClient.get<UserProfileResponse>('/customers/profile')
    if (res.data) return res.data
    throw new Error('Failed to fetch profile')
  },

  /** PUT /api/v1/customers/profile */
  updateProfile: async (payload: UpdateProfileRequest): Promise<UserProfileResponse> => {
    const res = await httpClient.put<UserProfileResponse>('/customers/profile', payload)
    if (res.data) return res.data
    throw new Error('Failed to update profile')
  },

  /** GET /api/v1/customers/addresses */
  getAddresses: async (): Promise<AddressResponse[]> => {
    try {
      const res = await httpClient.get<AddressResponse[]>('/customers/addresses')
      if (res.data) return res.data
    } catch {
      // Return empty list if no addresses
    }
    return []
  },

  /** POST /api/v1/customers/addresses */
  createAddress: async (payload: CreateAddressRequest): Promise<AddressResponse> => {
    const res = await httpClient.post<AddressResponse>('/customers/addresses', payload)
    if (res.data) return res.data
    throw new Error('Failed to create address')
  },

  /** PUT /api/v1/customers/addresses/{addressId}/default */
  setDefaultAddress: async (addressId: string): Promise<void> => {
    await httpClient.put<void>(`/customers/addresses/${addressId}/default`, {})
  },

  /** DELETE /api/v1/customers/addresses/{addressId}` */
  deleteAddress: async (addressId: string): Promise<void> => {
    await httpClient.delete<void>(`/customers/addresses/${addressId}`)
  },
}
