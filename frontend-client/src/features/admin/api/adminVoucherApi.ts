import { httpClient } from '../../../shared/api/httpClient'
import type { AdminVoucherItem, VoucherExpiryJobResult } from '../types/voucherTypes'
import { recordAuditLogMock } from './adminAuditApi'

const STORAGE_KEY = 'webchicken_admin_vouchers_v1'

function getStoredVouchers(): AdminVoucherItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.error('Lỗi đọc vouchers từ localStorage:', err)
  }
  return []
}

function saveVouchers(items: AdminVoucherItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Lỗi ghi vouchers vào localStorage:', err)
  }
}

/**
 * Lấy toàn bộ danh sách voucher dành cho trang quản trị
 */
export async function fetchAdminVouchers(): Promise<AdminVoucherItem[]> {
  try {
    const resp = await httpClient.get<AdminVoucherItem[]>('/api/v1/vouchers/all', {
      headers: { 'X-User-Role': 'SUPER_ADMIN' }
    })
    if (resp.data && Array.isArray(resp.data)) return resp.data
  } catch (err) {
    console.info('Backend vouchers/all offline, sử dụng local dataset:', err)
  }
  return getStoredVouchers()
}

/**
 * Kích hoạt Background Worker quét và vô hiệu hóa voucher hết hạn (TASK-70)
 */
export async function triggerVoucherExpiryJob(includeUsageLimit: boolean = true): Promise<VoucherExpiryJobResult> {
  // 1. Thử gọi API backend
  try {
    const resp = await httpClient.post<VoucherExpiryJobResult>(
      `/api/v1/jobs/deactivate-expired-vouchers?includeUsageLimit=${includeUsageLimit}`
    )
    if (resp.data && resp.data.deactivatedCount !== undefined) {
      syncLocalVoucherExpiry(includeUsageLimit)
      return resp.data
    }
  } catch (err) {
    console.info('Backend JobServlet chưa phản hồi, thực hiện quét trực tiếp trên local dataset:', err)
  }

  // 2. Fallback xử lý mô phỏng
  const count = syncLocalVoucherExpiry(includeUsageLimit)

  if (count > 0) {
    try {
      recordAuditLogMock({
        action: 'DEACTIVATE_EXPIRED_VOUCHERS',
        targetType: 'VOUCHER',
        targetId: `BATCH_${new Date().toISOString().slice(0, 10)}`,
        detail: `Hệ thống Background Worker VoucherExpiryWorker đã tự động quét và vô hiệu hóa ${count} voucher đã hết hạn hoặc hết lượt dùng.`,
        adminName: 'VoucherExpiryWorker',
        adminId: 'SYSTEM_WORKER'
      })
    } catch (e) {
      console.warn('Lỗi ghi audit log mô phỏng:', e)
    }
  }

  return {
    deactivatedCount: count,
    includeUsageLimit,
    scannedAt: new Date().toISOString(),
    message: `Đã quét và vô hiệu hóa thành công ${count} voucher hết hạn/hết lượt dùng.`
  }
}

function syncLocalVoucherExpiry(includeUsageLimit: boolean): number {
  const vouchers = getStoredVouchers()
  const now = new Date().getTime()
  let deactivatedCount = 0

  const updated = vouchers.map((v) => {
    if (!v.isActive) return v

    const isDateExpired = new Date(v.endDate).getTime() < now
    const isLimitExceeded = includeUsageLimit && v.usedCount >= v.usageLimit

    if (isDateExpired || isLimitExceeded) {
      deactivatedCount++
      return {
        ...v,
        isActive: false
      }
    }
    return v
  })

  saveVouchers(updated)
  return deactivatedCount
}

/**
 * Bật/tắt thủ công trạng thái voucher
 */
export async function toggleVoucherStatus(id: string): Promise<AdminVoucherItem> {
  const vouchers = getStoredVouchers()
  const idx = vouchers.findIndex((v) => v.id === id)
  if (idx === -1) throw new Error('Không tìm thấy voucher')

  vouchers[idx].isActive = !vouchers[idx].isActive
  saveVouchers(vouchers)
  return vouchers[idx]
}
