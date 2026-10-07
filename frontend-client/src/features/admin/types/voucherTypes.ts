export type VoucherType = 'PERCENTAGE' | 'AMOUNT'

export interface AdminVoucherItem {
  id: string
  code: string
  title: string
  description?: string
  type: VoucherType
  discountValueMinor: number
  minOrderValueMinor: number
  maxDiscountAmountMinor: number
  startDate: string
  endDate: string
  storeId?: string | null
  storeName?: string | null
  usageLimit: number
  usedCount: number
  isActive: boolean
}

export interface VoucherExpiryJobResult {
  deactivatedCount: number
  includeUsageLimit: boolean
  scannedAt: string
  message: string
}
