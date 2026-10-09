import { httpClient } from '../../../shared/api/httpClient'
import type { AuthResponseData, LoginPayload, RegisterPayload } from '../types/auth'

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponseData> => {
    try {
      const res = await httpClient.post<AuthResponseData>('/auth/login', payload)
      if (res.data) return res.data
      throw new Error('Đăng nhập không thành công.')
    } catch (err) {
      throw err
    }
  },

  register: async (payload: RegisterPayload): Promise<AuthResponseData> => {
    try {
      const res = await httpClient.post<AuthResponseData>('/auth/register', payload)
      if (res.data) return res.data
      throw new Error('Đăng ký không thành công.')
    } catch (err) {
      throw err
    }
  },

  logout: async (): Promise<void> => {
    try {
      await httpClient.post<void>('/auth/logout', {})
    } catch {
      // Logout hoàn tất
    }
  },

  refreshToken: async (): Promise<string> => {
    try {
      const res = await httpClient.post<{ accessToken: string }>('/auth/refresh-token', {})
      if (res.data?.accessToken) return res.data.accessToken
    } catch {
      // Ignored
    }
    throw new Error('Phiên đăng nhập hết hạn')
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponseData> => {
    try {
      const res = await httpClient.post<AuthResponseData>('/auth/social/google', { idToken })
      if (res.data) return res.data
      throw new Error('Đăng nhập với Google thất bại.')
    } catch (err) {
      throw err
    }
  },

  loginWithSocial: async (payload: { provider: string; idToken?: string; accessToken?: string }): Promise<AuthResponseData> => {
    try {
      const res = await httpClient.post<AuthResponseData>('/auth/social', payload)
      if (res.data) return res.data
      throw new Error('Đăng nhập qua mạng xã hội thất bại.')
    } catch (err) {
      throw err
    }
  },
}

