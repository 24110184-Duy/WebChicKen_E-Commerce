import { httpClient } from '../../../shared/api/httpClient'
import type { AuthResponseData, LoginPayload, RegisterPayload } from '../types/auth'

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponseData> => {
    const res = await httpClient.post<AuthResponseData>('/auth/login', payload)
    if (!res.data) throw new Error('Không nhận được dữ liệu xác thực từ máy chủ.')
    return res.data
  },

  register: async (payload: RegisterPayload): Promise<AuthResponseData> => {
    const res = await httpClient.post<AuthResponseData>('/auth/register', payload)
    if (!res.data) throw new Error('Đăng ký không thành công.')
    return res.data
  },

  logout: async (): Promise<void> => {
    await httpClient.post<void>('/auth/logout', {})
  },

  refreshToken: async (): Promise<string> => {
    const res = await httpClient.post<{ accessToken: string }>('/auth/refresh-token', {})
    if (!res.data?.accessToken) throw new Error('Làm mới phiên thất bại.')
    return res.data.accessToken
  }
}
