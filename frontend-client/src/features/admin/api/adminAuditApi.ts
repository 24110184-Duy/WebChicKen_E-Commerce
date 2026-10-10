import { httpClient } from '../../../shared/api/httpClient'
import type {
  AuditLogItem,
  AuditLogPageResponse
} from '../types'

/**
 * Lấy danh sách nhật ký kiểm toán quản trị từ CSDL (hỗ trợ phân trang, lọc theo action, targetType, search)
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
  const search = params?.search?.trim() || ''
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
    console.warn('Lỗi khi truy vấn nhật ký kiểm toán từ máy chủ:', err)
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
 * Lấy chi tiết một bản ghi nhật ký kiểm toán theo ID từ CSDL
 */
export async function fetchAuditLogById(id: string): Promise<AuditLogItem> {
  const resp = await httpClient.get<AuditLogItem>(`/api/v1/admin/audit-logs/${id}`)
  if (!resp.data) {
    throw new Error(`Không tìm thấy nhật ký kiểm toán với mã ${id}`)
  }
  return resp.data
}
