import { httpClient } from '../../../shared/api/httpClient'
import type {
  AuditLogItem,
  AuditLogPageResponse
} from '../types'

// Mock dữ liệu nhật ký kiểm toán thực tế cho sàn WebChicKen Marketplace
const INITIAL_DEMO_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-audit-001',
    adminId: 'usr-admin-001',
    adminEmail: 'admin@webchicken.vn',
    adminName: 'Super Admin Tổng Quản',
    action: 'BAN_USER',
    targetType: 'USER',
    targetId: 'usr-mod-005',
    detail: 'Khóa tài khoản vĩnh viễn người dùng Phạm Văn Tuấn do hành vi spam đơn hàng giả mạo và đánh giá độc hại',
    ipAddress: '113.161.45.12',
    createdAt: '2026-10-06T15:30:00Z'
  },
  {
    id: 'log-audit-002',
    adminId: 'usr-admin-002',
    adminEmail: 'moderator01@webchicken.vn',
    adminName: 'Trần Thị Thu Thảo (Kiểm duyệt viên)',
    action: 'APPROVE_PRODUCT',
    targetType: 'PRODUCT',
    targetId: 'prod-ga-yenthe-01',
    detail: 'Duyệt mở bán sản phẩm: Gà Đồi Yên Thế Hút Chân Không (Chứng chỉ VietGAP hợp lệ)',
    ipAddress: '14.162.180.99',
    createdAt: '2026-10-06T14:15:20Z'
  },
  {
    id: 'log-audit-003',
    adminId: 'usr-admin-002',
    adminEmail: 'moderator01@webchicken.vn',
    adminName: 'Trần Thị Thu Thảo (Kiểm duyệt viên)',
    action: 'REJECT_PRODUCT',
    targetType: 'PRODUCT',
    targetId: 'prod-ga-dongtao-03',
    detail: 'Từ chối duyệt sản phẩm: Gà Đông Tảo Biếu Tết. Lý do: Thiếu giấy chứng nhận kiểm dịch thú y liên tỉnh',
    ipAddress: '14.162.180.99',
    createdAt: '2026-10-06T11:45:10Z'
  },
  {
    id: 'log-audit-004',
    adminId: 'usr-admin-001',
    adminEmail: 'admin@webchicken.vn',
    adminName: 'Super Admin Tổng Quản',
    action: 'APPROVE_SELLER',
    targetType: 'SELLER_APPLICATION',
    targetId: 'app-shop-008',
    detail: 'Phê duyệt hồ sơ người bán cho Hợp tác xã Chăn nuôi Gà Thả Vườn Lạc Thủy',
    ipAddress: '113.161.45.12',
    createdAt: '2026-10-05T16:20:00Z'
  },
  {
    id: 'log-audit-005',
    adminId: 'usr-admin-002',
    adminEmail: 'moderator01@webchicken.vn',
    adminName: 'Trần Thị Thu Thảo (Kiểm duyệt viên)',
    action: 'REJECT_SELLER',
    targetType: 'SELLER_APPLICATION',
    targetId: 'app-shop-009',
    detail: 'Từ chối hồ sơ người bán: Cửa hàng Thịt Gà Nhanh. Lý do: Giấy phép kinh doanh đã hết hạn sử dụng',
    ipAddress: '14.162.180.99',
    createdAt: '2026-10-05T10:10:00Z'
  },
  {
    id: 'log-audit-006',
    adminId: 'usr-admin-001',
    adminEmail: 'admin@webchicken.vn',
    adminName: 'Super Admin Tổng Quản',
    action: 'UNBAN_USER',
    targetType: 'USER',
    targetId: 'usr-mod-004',
    detail: 'Mở khóa tài khoản người dùng Đặng Tuấn Kiệt sau khi hoàn tất giải trình giao dịch nhầm lẫn',
    ipAddress: '113.161.45.12',
    createdAt: '2026-10-04T09:05:00Z'
  },
  {
    id: 'log-audit-007',
    adminId: 'usr-admin-002',
    adminEmail: 'moderator01@webchicken.vn',
    adminName: 'Trần Thị Thu Thảo (Kiểm duyệt viên)',
    action: 'APPROVE_PRODUCT',
    targetType: 'PRODUCT',
    targetId: 'prod-trung-ga-ta-02',
    detail: 'Duyệt mở bán sản phẩm: Trứng Gà Ta Thảo Dược Hộp 10 Quả (Đạt chuẩn OCOP 4 sao)',
    ipAddress: '14.162.180.99',
    createdAt: '2026-10-03T13:40:00Z'
  }
]

const STORAGE_KEY = 'webchicken_admin_audit_logs_v1'

function getStoredAuditLogs(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc cache audit logs từ localStorage:', err)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_AUDIT_LOGS))
  return INITIAL_DEMO_AUDIT_LOGS
}

function saveStoredAuditLogs(logs: AuditLogItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch (err) {
    console.error('Lỗi lưu cache audit logs vào localStorage:', err)
  }
}

/**
 * Lấy danh sách nhật ký kiểm toán quản trị (hỗ trợ phân trang, lọc theo action, targetType, search)
 */
export async function fetchAuditLogs(params?: {
  page?: number
  size?: number
  adminId?: string
  action?: string
  targetType?: string
  search?: string
}): Promise<AuditLogPageResponse> {
  const page = Math.max(1, params?.page || 1)
  const size = Math.min(100, Math.max(1, params?.size || 20))
  const search = params?.search?.trim().toLowerCase() || ''
  const action = params?.action?.trim().toUpperCase() || 'ALL'
  const targetType = params?.targetType?.trim().toUpperCase() || 'ALL'
  const adminId = params?.adminId?.trim() || ''

  try {
    const query = new URLSearchParams()
    query.set('page', page.toString())
    query.set('size', size.toString())
    if (search) query.set('search', search)
    if (action && action !== 'ALL') query.set('action', action)
    if (targetType && targetType !== 'ALL') query.set('targetType', targetType)
    if (adminId) query.set('adminId', adminId)

    const resp = await httpClient.get<AuditLogPageResponse>(`/api/v1/admin/audit-logs?${query.toString()}`)
    if (resp.data && resp.data.items && resp.data.items.length > 0) {
      return resp.data
    }
  } catch (err) {
    console.info('API backend chưa khả dụng hoặc trả lỗi, sử dụng bộ lưu trữ mô phỏng WebChicKen Audit Log:', err)
  }

  // Fallback demo dataset
  const allLogs = getStoredAuditLogs()
  let filtered = allLogs.filter((item) => {
    // Lọc theo search
    if (search) {
      const matchDetail = (item.detail || '').toLowerCase().includes(search)
      const matchTargetId = (item.targetId || '').toLowerCase().includes(search)
      const matchAdminEmail = (item.adminEmail || '').toLowerCase().includes(search)
      const matchAdminName = (item.adminName || '').toLowerCase().includes(search)
      const matchIp = (item.ipAddress || '').toLowerCase().includes(search)
      if (!matchDetail && !matchTargetId && !matchAdminEmail && !matchAdminName && !matchIp) {
        return false
      }
    }

    // Lọc theo Action
    if (action !== 'ALL' && item.action !== action) {
      return false
    }

    // Lọc theo TargetType
    if (targetType !== 'ALL' && item.targetType !== targetType) {
      return false
    }

    // Lọc theo AdminId
    if (adminId && item.adminId !== adminId) {
      return false
    }

    return true
  })

  // Sắp xếp mới nhất lên đầu
  filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = filtered.length
  const totalPages = Math.ceil(total / size) || 1
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
 * Lấy chi tiết một bản ghi nhật ký kiểm toán theo ID
 */
export async function fetchAuditLogById(id: string): Promise<AuditLogItem> {
  try {
    const resp = await httpClient.get<AuditLogItem>(`/api/v1/admin/audit-logs/${id}`)
    if (resp.data && resp.data.id) {
      return resp.data
    }
  } catch (err) {
    console.info('API backend chưa trả chi tiết audit log, tìm kiếm trong kho dữ liệu demo:', err)
  }

  const logs = getStoredAuditLogs()
  const found = logs.find((l) => l.id === id)
  if (!found) {
    throw new Error(`Không tìm thấy nhật ký kiểm toán với mã ${id}`)
  }
  return found
}

/**
 * Helper ghi nhận một audit log vào cache mô phỏng (dùng khi tương tác trên UI demo)
 */
export function recordAuditLogMock(entry: {
  action: string
  targetType?: string
  targetId?: string
  detail?: string
  ipAddress?: string
  adminId?: string
  adminEmail?: string
  adminName?: string
}): AuditLogItem {
  const currentLogs = getStoredAuditLogs()
  const newLog: AuditLogItem = {
    id: `log-audit-${Date.now().toString().slice(-6)}`,
    adminId: entry.adminId || 'usr-admin-001',
    adminEmail: entry.adminEmail || 'admin@webchicken.vn',
    adminName: entry.adminName || 'Super Admin Tổng Quản',
    action: entry.action.toUpperCase(),
    targetType: entry.targetType ? entry.targetType.toUpperCase() : null,
    targetId: entry.targetId || null,
    detail: entry.detail || null,
    ipAddress: entry.ipAddress || '127.0.0.1',
    createdAt: new Date().toISOString()
  }

  const updated = [newLog, ...currentLogs]
  saveStoredAuditLogs(updated)
  return newLog
}
