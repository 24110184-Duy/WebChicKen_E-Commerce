import { httpClient } from '../../../shared/api/httpClient'
import type { AdminVoucherItem, VoucherExpiryJobResult } from '../types/voucherTypes'
import { recordAuditLogMock } from './adminAuditApi'

const STORAGE_KEY = 'webchicken_admin_vouchers_v1'

const INITIAL_DEMO_VOUCHERS: AdminVoucherItem[] = [
  {
    id: 'v-001',
    code: 'FREESHIP_MAX',
    title: 'Miễn phí vận chuyển hỏa tốc toàn quốc',
    description: 'Áp dụng cho mọi đơn hàng gà tươi sống đạt giá trị tối thiểu 150.000 ₫',
    type: 'AMOUNT',
    discountValueMinor: 30000,
    minOrderValueMinor: 150000,
    maxDiscountAmountMinor: 30000,
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-11-30T23:59:59Z',
    storeId: null,
    storeName: 'Toàn sàn WebChicKen',
    usageLimit: 1000,
    usedCount: 785,
    isActive: true
  },
  {
    id: 'v-002',
    code: 'CHICKEN_TET2026',
    title: 'Đại tiệc Gà Cúng Tết Bính Ngọ - Giảm 15%',
    description: 'Chương trình tri ân Tết Nguyên Đán cho khách mua gà Đông Tảo và Gà Hồ',
    type: 'PERCENTAGE',
    discountValueMinor: 15,
    minOrderValueMinor: 500000,
    maxDiscountAmountMinor: 100000,
    startDate: '2026-01-10T00:00:00Z',
    endDate: '2026-02-28T23:59:59Z', // Đã quá hạn!
    storeId: null,
    storeName: 'Toàn sàn WebChicKen',
    usageLimit: 500,
    usedCount: 420,
    isActive: true // Sẽ được quét và vô hiệu hóa bởi VoucherExpiryWorker
  },
  {
    id: 'v-003',
    code: 'OCOP_DISCOUNT50K',
    title: 'Trợ giá Nông sản OCOP 4 sao Yên Thế',
    description: 'Ưu đãi dành riêng cho sản phẩm Gà Đồi Yên Thế đạt chứng nhận OCOP',
    type: 'AMOUNT',
    discountValueMinor: 50000,
    minOrderValueMinor: 300000,
    maxDiscountAmountMinor: 50000,
    startDate: '2026-08-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    storeId: 'store-yenthe-01',
    storeName: 'Trang Trại Gà Đồi Yên Thế - Bắc Giang',
    usageLimit: 200,
    usedCount: 200, // Đã chạm giới hạn sử dụng!
    isActive: true // Sẽ được quét và vô hiệu hóa bởi VoucherExpiryWorker
  },
  {
    id: 'v-004',
    code: 'FLASH_DEAL_AUTUMN',
    title: 'Ưu đãi Lễ hội Mùa Thu Giảm 20K',
    description: 'Chiến dịch kích cầu tiêu dùng nông sản tuần lễ đầu tháng 9',
    type: 'AMOUNT',
    discountValueMinor: 20000,
    minOrderValueMinor: 100000,
    maxDiscountAmountMinor: 20000,
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-15T23:59:59Z', // Đã hết hạn
    storeId: null,
    storeName: 'Toàn sàn WebChicKen',
    usageLimit: 300,
    usedCount: 300,
    isActive: false
  },
  {
    id: 'v-005',
    code: 'WELCOME_NEWBIE',
    title: 'Quà tặng chào mừng Khách hàng Mới',
    description: 'Giảm ngay 25.000 ₫ cho lần mua sắm gia cầm đầu tiên tại WebChicKen',
    type: 'AMOUNT',
    discountValueMinor: 25000,
    minOrderValueMinor: 99000,
    maxDiscountAmountMinor: 25000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    storeId: null,
    storeName: 'Toàn sàn WebChicKen',
    usageLimit: 5000,
    usedCount: 1240,
    isActive: true
  }
]

function getStoredVouchers(): AdminVoucherItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (err) {
    console.error('Lỗi đọc vouchers từ localStorage:', err)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_VOUCHERS))
  return INITIAL_DEMO_VOUCHERS
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
    if (resp.data && resp.data.length > 0) return resp.data
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
      // Cập nhật lại cache local
      syncLocalVoucherExpiry(includeUsageLimit)
      return resp.data
    }
  } catch (err) {
    console.info('Backend JobServlet chưa phản hồi, thực hiện quét trực tiếp trên local dataset:', err)
  }

  // 2. Fallback xử lý mô phỏng chuẩn logic của VoucherExpiryWorker
  const count = syncLocalVoucherExpiry(includeUsageLimit)

  // Ghi nhận nhật ký kiểm toán (TASK-67 reuse)
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

/**
 * Helper quét và đồng bộ trạng thái voucher hết hạn trong cache
 */
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
