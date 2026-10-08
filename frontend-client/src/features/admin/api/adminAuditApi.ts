import { httpClient } from '../../../shared/api/httpClient'
import type {
  AuditLogItem,
  AuditLogPageResponse
} from '../types'

// Danh sách nhật ký kiểm toán quản trị
const INITIAL_DEMO_AUDIT_LOGS: AuditLogItem[] = []

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
