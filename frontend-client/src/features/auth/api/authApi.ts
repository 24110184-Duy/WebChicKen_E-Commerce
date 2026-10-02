import { httpClient } from '../../../shared/api/httpClient'
import type { AuthResponseData, LoginPayload, RegisterPayload } from '../types/auth'

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponseData> => {
    try {
      const res = await httpClient.post<AuthResponseData>('/auth/login', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('Backend server offline hoặc chưa kết nối, chuyển sang chế độ Mock Auth để test UI:', err)
    }

    // Mock fallback khi Backend chưa chạy
    await new Promise((resolve) => setTimeout(resolve, 500))
    const userName = payload.email.includes('@') ? payload.email.split('@')[0] : payload.email
    return {
      accessToken: 'mock-jwt-token-' + Date.now(),
      user: {
        userId: 'usr-mock-12345',
        email: payload.email,
        fullName: userName.charAt(0).toUpperCase() + userName.slice(1),
        phone: '0912345678',
        roles: ['CUSTOMER'],
        logoUrl: undefined,
      },
    }
  },

  register: async (payload: RegisterPayload): Promise<AuthResponseData> => {
    try {
      const res = await httpClient.post<AuthResponseData>('/auth/register', payload)
      if (res.data) return res.data
    } catch (err) {
      console.warn('Backend server offline hoặc chưa kết nối, chuyển sang chế độ Mock Auth để test UI:', err)
    }

    // Mock fallback khi Backend chưa chạy
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      accessToken: 'mock-jwt-token-' + Date.now(),
      user: {
        userId: 'usr-mock-' + Date.now(),
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone,
        roles: ['CUSTOMER'],
        logoUrl: undefined,
      },
    }
  },

  logout: async (): Promise<void> => {
    try {
      await httpClient.post<void>('/auth/logout', {})
    } catch {
      // Mock logout hoàn tất
    }
  },

  refreshToken: async (): Promise<string> => {
    try {
      const res = await httpClient.post<{ accessToken: string }>('/auth/refresh-token', {})
      if (res.data?.accessToken) return res.data.accessToken
    } catch {
      // Bỏ qua khi mock mode
    }
    throw new Error('Chế độ Mock không cần refresh token')
  },
}

