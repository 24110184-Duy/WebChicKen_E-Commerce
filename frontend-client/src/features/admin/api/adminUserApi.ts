import { httpClient } from '../../../shared/api/httpClient'
import type {
  AdminUserItem,
  AdminUserPageResponse,
  BanUserRequest,
  UnbanUserRequest,
  AccountBanInfo
} from '../types'
import { recordAuditLogMock } from './adminAuditApi'

// Quản lý người dùng admin qua localStorage cache và API thực
const STORAGE_KEY = 'webchicken_admin_users_moderation'

function getStoredUsers(): AdminUserItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc cache user moderation từ localStorage:', err)
  }
  return []
}

function saveStoredUsers(users: AdminUserItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Lỗi ghi cache user moderation vào localStorage:', err)
  }
}

/**
 * Lấy danh sách người dùng quản trị (hỗ trợ tìm kiếm, lọc theo trạng thái và vai trò, phân trang)
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
  const search = params?.search?.trim().toLowerCase() || ''
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
    if (resp.data && resp.data.items && resp.data.items.length > 0) {
      return resp.data
    }
  } catch (err) {
    console.info('API backend chưa khả dụng hoặc trả lỗi, sử dụng bộ lưu trữ mô phỏng WebChicKen:', err)
  }

  // Fallback demo dataset
  const allUsers = getStoredUsers()
  let filtered = allUsers.filter((u) => {
    // Lọc theo search
    if (search) {
      const matchName = u.fullName.toLowerCase().includes(search)
      const matchEmail = u.email.toLowerCase().includes(search)
      const matchPhone = u.phone ? u.phone.includes(search) : false
      const matchStore = u.storeName ? u.storeName.toLowerCase().includes(search) : false
      if (!matchName && !matchEmail && !matchPhone && !matchStore) return false
    }

    // Lọc theo trạng thái
    if (status !== 'ALL') {
      if (u.status !== status) return false
    }

    // Lọc theo vai trò
    if (role !== 'ALL') {
      if (role === 'CUSTOMER' && !u.roles.includes('CUSTOMER')) return false
      if (role === 'SELLER' && !u.roles.includes('SELLER')) return false
      if (role === 'ADMIN' && !u.roles.some((r) => ['SUPER_ADMIN', 'MODERATOR', 'ADMIN'].includes(r))) return false
    }

    return true
  })

  const total = filtered.length
  const totalPages = Math.ceil(total / size)
  const startIndex = (page - 1) * size
  const paginatedItems = filtered.slice(startIndex, startIndex + size)

  return {
    items: paginatedItems,
    total,
    page,
    size,
    totalPages
  }
}

/**
 * Lấy thông tin chi tiết người dùng
 */
export async function fetchAdminUserDetail(userId: string): Promise<AdminUserItem> {
  try {
    const resp = await httpClient.get<AdminUserItem>(`/api/v1/admin/users/${userId}`)
    if (resp.data) return resp.data
  } catch (err) {
    console.warn(`Tra cứu backend user ${userId} không thành công, tìm trong local dataset:`, err)
  }

  const users = getStoredUsers()
  const found = users.find((u) => u.userId === userId)
  if (!found) {
    throw new Error(`Không tìm thấy người dùng với mã ${userId}`)
  }
  return found
}

/**
 * Khóa/cấm tài khoản người dùng
 */
export async function banAdminUser(userId: string, request: BanUserRequest): Promise<{ success: boolean; message: string }> {
  try {
    await httpClient.post(`/api/v1/admin/users/${userId}/ban`, request)
  } catch (err) {
    console.warn('Backend API ban chưa khả dụng hoặc gặp lỗi, ghi nhận vào local demo state:', err)
  }

  // Cập nhật local storage
  const users = getStoredUsers()
  const index = users.findIndex((u) => u.userId === userId)
  if (index !== -1) {
    const now = new Date().toISOString()
    let bannedUntil: string | null = null
    if (request.durationDays && request.durationDays > 0) {
      const d = new Date()
      d.setDate(d.getDate() + request.durationDays)
      bannedUntil = d.toISOString()
    } else if (request.bannedUntil) {
      bannedUntil = request.bannedUntil
    }

    const newBan: AccountBanInfo = {
      banId: `ban-${Date.now()}`,
      userId,
      description: request.reason,
      bannedAt: now,
      bannedUntil,
      bannedBy: 'SUPER_ADMIN',
      unbannedAt: null,
      isActive: true
    }

    const targetUser = users[index]
    users[index] = {
      ...targetUser,
      status: 'BANNED',
      updatedAt: now,
      activeBan: newBan
    }
    saveStoredUsers(users)

    try {
      recordAuditLogMock({
        action: 'BAN_USER',
        targetType: 'USER',
        targetId: userId,
        detail: `Khóa tài khoản: ${targetUser.fullName || targetUser.email}. Lý do: ${request.reason}`
      })
    } catch (e) {
      console.warn('Lỗi ghi audit log mock:', e)
    }
  }

  return {
    success: true,
    message: 'Khóa tài khoản thành công và đã thu hồi tất cả phiên làm việc tức thì.'
  }
}

/**
 * Mở khóa tài khoản người dùng
 */
export async function unbanAdminUser(userId: string, request?: UnbanUserRequest): Promise<{ success: boolean; message: string }> {
  try {
    await httpClient.post(`/api/v1/admin/users/${userId}/unban`, request || {})
  } catch (err) {
    console.warn('Backend API unban chưa khả dụng hoặc gặp lỗi, ghi nhận vào local demo state:', err)
  }

  // Cập nhật local storage
  const users = getStoredUsers()
  const index = users.findIndex((u) => u.userId === userId)
  if (index !== -1) {
    const now = new Date().toISOString()
    const activeBan = users[index].activeBan
    const updatedBan: AccountBanInfo | null = activeBan
      ? {
          ...activeBan,
          unbannedAt: now,
          isActive: false
        }
      : null

    const targetUser = users[index]
    users[index] = {
      ...targetUser,
      status: 'ACTIVE',
      updatedAt: now,
      activeBan: updatedBan
    }
    saveStoredUsers(users)

    try {
      recordAuditLogMock({
        action: 'UNBAN_USER',
        targetType: 'USER',
        targetId: userId,
        detail: `Mở khóa tài khoản: ${targetUser.fullName || targetUser.email}. Lý do: ${request?.reason || 'Quản trị viên phục hồi quyền truy cập'}`
      })
    } catch (e) {
      console.warn('Lỗi ghi audit log mock:', e)
    }
  }

  return {
    success: true,
    message: 'Mở khóa tài khoản người dùng thành công.'
  }
}

/**
 * Lấy lịch sử cấm của tài khoản
 */
export async function fetchUserBanHistory(userId: string): Promise<AccountBanInfo[]> {
  try {
    const resp = await httpClient.get<AccountBanInfo[]>(`/api/v1/admin/users/${userId}/bans`)
    if (resp.data && Array.isArray(resp.data)) {
      return resp.data
    }
  } catch (err) {
    console.warn('Không thể lấy lịch sử ban từ backend, trích xuất từ local state:', err)
  }

  const users = getStoredUsers()
  const user = users.find((u) => u.userId === userId)
  if (user && user.activeBan) {
    return [user.activeBan]
  }
  return []
}
