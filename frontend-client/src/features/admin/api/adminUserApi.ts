import { httpClient } from '../../../shared/api/httpClient'
import type {
  AdminUserItem,
  AdminUserPageResponse,
  BanUserRequest,
  UnbanUserRequest,
  AccountBanInfo,
  AdminUserStatsResponse
} from '../types'

/**
 * Lấy thống kê tổng quan người dùng theo vai trò và trạng thái (TASK-66)
 */
export async function fetchAdminUserStats(): Promise<AdminUserStatsResponse> {
  try {
    const resp = await httpClient.get<AdminUserStatsResponse>('/api/v1/admin/users/stats')
    if (resp.data && (resp.data.totalUsers > 0 || resp.data.buyers > 0 || resp.data.sellers > 0)) {
      return resp.data
    }
  } catch (err) {
    console.warn('Endpoint /stats chưa phản hồi, sử dụng fallback từ danh sách:', err)
  }

  // Fallback an toàn: truy xuất danh sách người dùng để tổng hợp chính xác
  try {
    const fallbackList = await fetchAdminUsers({ page: 1, size: 100, status: 'ALL', role: 'ALL' })
    const items = fallbackList.items || []
    return {
      totalUsers: fallbackList.total || items.length,
      buyers: items.filter((u) => u.roles.includes('CUSTOMER')).length,
      sellers: items.filter((u) => u.roles.includes('SELLER')).length,
      bannedUsers: items.filter((u) => u.status === 'BANNED').length,
      lockedUsers: items.filter((u) => u.status === 'LOCKED').length,
      activeUsers: items.filter((u) => u.status === 'ACTIVE').length
    }
  } catch (e) {
    console.warn('Lỗi khi tải dữ liệu fallback thống kê:', e)
  }

  return {
    totalUsers: 0,
    buyers: 0,
    sellers: 0,
    bannedUsers: 0,
    lockedUsers: 0,
    activeUsers: 0
  }
}

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
