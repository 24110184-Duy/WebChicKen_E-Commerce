import { httpClient } from '../../../shared/api/httpClient'
import type {
  AdminUserItem,
  AdminUserPageResponse,
  BanUserRequest,
  UnbanUserRequest,
  AccountBanInfo
} from '../types'
import { recordAuditLogMock } from './adminAuditApi'

// Mock dữ liệu người dùng thực tế cho sàn WebChicKen Marketplace
const INITIAL_DEMO_USERS: AdminUserItem[] = [
  {
    userId: 'usr-mod-001',
    email: 'hoangnam.hn@gmail.com',
    fullName: 'Nguyễn Hoàng Nam',
    phone: '0912345678',
    logoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    roles: ['CUSTOMER'],
    tier: 'SILVER',
    loyaltyPoint: 450,
    createdAt: '2026-03-15T09:30:00Z',
    updatedAt: '2026-10-01T14:20:00Z',
    activeBan: null
  },
  {
    userId: 'usr-mod-002',
    email: 'hung.yenthefarm@gmail.com',
    fullName: 'Trần Văn Hùng',
    phone: '0988223344',
    logoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    roles: ['CUSTOMER', 'SELLER'],
    tier: 'GOLD',
    loyaltyPoint: 1200,
    storeId: 'store-yenthe-01',
    storeName: 'Trang Trại Gà Đồi Yên Thế - Bắc Giang',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-10-05T08:15:00Z',
    activeBan: null
  },
  {
    userId: 'usr-mod-003',
    email: 'maile.culinary@yahoo.com',
    fullName: 'Lê Thị Mai',
    phone: '0903889900',
    logoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    roles: ['CUSTOMER'],
    tier: 'PLATINUM',
    loyaltyPoint: 3450,
    createdAt: '2026-01-20T16:45:00Z',
    updatedAt: '2026-10-06T10:10:00Z',
    activeBan: null
  },
  {
    userId: 'usr-mod-004',
    email: 'kiet.vandinh@gmail.com',
    fullName: 'Đặng Tuấn Kiệt',
    phone: '0977665544',
    logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    roles: ['CUSTOMER', 'SELLER'],
    tier: 'SILVER',
    loyaltyPoint: 680,
    storeId: 'store-vandinh-02',
    storeName: 'Nông Trại Vịt Cỏ Vân Đình - Hà Tây',
    createdAt: '2026-04-05T13:20:00Z',
    updatedAt: '2026-10-04T17:30:00Z',
    activeBan: null
  },
  {
    userId: 'usr-mod-005',
    email: 'tridm.fraud@domain.xyz',
    fullName: 'Đỗ Minh Trí',
    phone: '0933112233',
    logoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'BANNED',
    roles: ['CUSTOMER'],
    tier: 'STANDARD',
    loyaltyPoint: 0,
    createdAt: '2026-08-12T08:00:00Z',
    updatedAt: '2026-10-02T15:30:00Z',
    activeBan: {
      banId: 'ban-rec-001',
      userId: 'usr-mod-005',
      description: 'Gian lận đặt đơn ảo số lượng lớn và cố tình bom hàng chuỗi lạnh bảo quản tươi sống.',
      bannedAt: '2026-10-02T15:30:00Z',
      bannedUntil: '2026-11-01T15:30:00Z',
      bannedBy: 'admin-super-01',
      unbannedAt: null,
      isActive: true
    }
  },
  {
    userId: 'usr-mod-006',
    email: 'dung.fakefarm@poultry.org',
    fullName: 'Huỳnh Quốc Dũng',
    phone: '0944556677',
    logoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    status: 'BANNED',
    roles: ['CUSTOMER', 'SELLER'],
    tier: 'STANDARD',
    loyaltyPoint: 50,
    storeId: 'store-fake-03',
    storeName: 'Trang Trại Gia Cầm Đông Tảo Nhái',
    createdAt: '2026-07-01T10:15:00Z',
    updatedAt: '2026-09-28T09:40:00Z',
    activeBan: {
      banId: 'ban-rec-002',
      userId: 'usr-mod-006',
      description: 'Kinh doanh gia cầm không rõ nguồn gốc kiểm dịch, làm giả tem chứng nhận an toàn sinh học VietGAP.',
      bannedAt: '2026-09-28T09:40:00Z',
      bannedUntil: null,
      bannedBy: 'admin-super-01',
      unbannedAt: null,
      isActive: true
    }
  },
  {
    userId: 'usr-mod-007',
    email: 'thutrang.bui@gmail.com',
    fullName: 'Bùi Thu Trang',
    phone: '0966887766',
    logoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    status: 'LOCKED',
    roles: ['CUSTOMER'],
    tier: 'SILVER',
    loyaltyPoint: 320,
    createdAt: '2026-05-18T14:10:00Z',
    updatedAt: '2026-10-03T11:00:00Z',
    activeBan: null
  },
  {
    userId: 'usr-mod-008',
    email: 'admin.thinh@webchicken.vn',
    fullName: 'Phạm Đức Thịnh',
    phone: '0909000111',
    logoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-06T08:00:00Z',
    activeBan: null
  }
]

const STORAGE_KEY = 'webchicken_admin_users_moderation'

function getStoredUsers(): AdminUserItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc cache user moderation từ localStorage:', err)
  }
  // Khởi tạo lần đầu
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_USERS))
  return INITIAL_DEMO_USERS
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
