import { httpClient } from '../../../shared/api/httpClient'
import type { AdminVoucherItem, CreateVoucherPayload, VoucherExpiryJobResult } from '../types/voucherTypes'

/**
 * Lấy toàn bộ danh sách voucher dành cho trang quản trị từ CSDL
 */
export async function fetchAdminVouchers(): Promise<AdminVoucherItem[]> {
  try {
    const resp = await httpClient.get<AdminVoucherItem[]>('/vouchers?all=true')
    if (resp.data && Array.isArray(resp.data)) return resp.data
  } catch (err) {
    console.warn('Lỗi tải danh sách voucher từ máy chủ:', err)
  }
  return []
}

/**
 * Tạo mới voucher toàn sàn hoặc theo danh mục
 */
export async function createVoucher(payload: CreateVoucherPayload): Promise<AdminVoucherItem> {
  const resp = await httpClient.post<AdminVoucherItem>('/vouchers', payload)
  return resp.data
}

/**
 * Xóa một voucher
 */
export async function deleteVoucher(id: string): Promise<void> {
  await httpClient.delete(`/vouchers/${id}`)
}

/**
 * Kích hoạt Background Worker quét và vô hiệu hóa voucher hết hạn (TASK-70)
 */
export async function triggerVoucherExpiryJob(includeUsageLimit: boolean = true): Promise<VoucherExpiryJobResult> {
  const resp = await httpClient.post<VoucherExpiryJobResult>(
    `/jobs/deactivate-expired-vouchers?includeUsageLimit=${includeUsageLimit}`
  )
  if (resp.data && resp.data.deactivatedCount !== undefined) {
    return resp.data
  }

  return {
    deactivatedCount: 0,
    includeUsageLimit,
    scannedAt: new Date().toISOString(),
    message: 'Không có voucher nào cần vô hiệu hóa.'
  }
}

/**
 * Bật/tắt trạng thái hoạt động của voucher
 */
export async function toggleVoucherStatus(id: string): Promise<AdminVoucherItem> {
  const resp = await httpClient.post<AdminVoucherItem>(`/vouchers/${id}/toggle`)
  return resp.data
}
