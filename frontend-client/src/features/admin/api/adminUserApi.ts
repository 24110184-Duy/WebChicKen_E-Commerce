import { httpClient } from '../../../shared/api/httpClient'
import type {
  AdminUserItem,
  AdminUserPageResponse,
  BanUserRequest,
  UnbanUserRequest,
  AccountBanInfo
} from '../types'

/**
 * Lấy danh sách người dùng quản trị từ CSDL (hỗ trợ tìm kiếm, lọc theo trạng thái và vai trò, phân trang)
 */
export async function fetchAdminUsers(params?: {
  page?: number
  size?: number
  search?: string
  status?: string
  role?: string
}): Promise<AdminUserPageResponse> {
  const page = Math.max(1, params?.page || 1)
  const size = Math.min(100, Math.max(1, params?.size || 20))
  const search = params?.search?.trim() || ''
  const status = params?.status?.trim().toUpperCase() || 'ALL'
  const role = params?.role?.trim().toUpperCase() || 'ALL'

  try {
    const query = new URLSearchParams()
    query.set('page', page.toString())
    query.set('size', size.toString())
    if (search) query.set('search', search)
    if (status && status !== 'ALL') query.set('status', status)
    if (role && role !== 'ALL') query.set('role', role)

    const resp = await httpClient.get<AdminUserPageResponse>(`/api/v1/admin/users?${query.toString()}`)
    if (resp.data) {
      return {
        items: resp.data.items || [],
        total: resp.data.total ?? (resp.data.items?.length || 0),
        page: resp.data.page ?? page,
        size: resp.data.size ?? size,
        totalPages: resp.data.totalPages ?? Math.ceil((resp.data.total ?? 0) / size),
      }
    }
  } catch (err) {
    console.warn('Lỗi khi tải danh sách người dùng quản trị từ máy chủ:', err)
  }

  return {
    items: [],
    total: 0,
    page,
    size,
    totalPages: 0,
  }
}

/**
 * Lấy chi tiết tài khoản người dùng theo ID từ CSDL
 */
export async function fetchAdminUserById(userId: string): Promise<AdminUserItem> {
  const resp = await httpClient.get<AdminUserItem>(`/api/v1/admin/users/${userId}`)
  if (!resp.data) {
    throw new Error(`Không tìm thấy người dùng với mã ${userId}`)
  }
  return resp.data
}

/**
 * Khóa/cấm tài khoản người dùng qua API backend (POST /api/v1/admin/users/{id}/ban)
 */
export async function banAdminUser(userId: string, request: BanUserRequest): Promise<{ success: boolean; message: string }> {
  await httpClient.post(`/api/v1/admin/users/${userId}/ban`, request)
  return {
    success: true,
    message: 'Khóa tài khoản thành công và đã thu hồi tất cả phiên làm việc tức thì.'
  }
}

/**
 * Mở khóa tài khoản người dùng qua API backend (POST /api/v1/admin/users/{id}/unban)
 */
export async function unbanAdminUser(userId: string, request?: UnbanUserRequest): Promise<{ success: boolean; message: string }> {
  await httpClient.post(`/api/v1/admin/users/${userId}/unban`, request || {})
  return {
    success: true,
    message: 'Mở khóa tài khoản người dùng thành công.'
  }
}

/**
 * Lấy lịch sử cấm của tài khoản từ CSDL backend
 */
export async function fetchUserBanHistory(userId: string): Promise<AccountBanInfo[]> {
  try {
    const resp = await httpClient.get<AccountBanInfo[]>(`/api/v1/admin/users/${userId}/bans`)
    if (resp.data && Array.isArray(resp.data)) {
      return resp.data
    }
  } catch (err) {
    console.warn('Không thể lấy lịch sử ban từ backend:', err)
  }
  return []
}
