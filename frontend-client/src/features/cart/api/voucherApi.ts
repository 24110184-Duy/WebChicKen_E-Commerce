import { httpClient } from '../../../shared/api/httpClient'

export interface BackendVoucher {
  id: string
  code: string
  title: string
  description?: string
  type: 'PERCENTAGE' | 'AMOUNT'
  discountValueMinor: number
  minOrderValueMinor: number
  maxDiscountAmountMinor: number
  startDate: string
  endDate: string
  storeId?: string
  usageLimit: number
  usedCount: number
  isActive: boolean
}

export interface ValidateVoucherResult {
  voucherId: string
  code: string
  isValid: boolean
  discountAmountMinor: number
  finalAmountMinor: number
  message: string
}

export const voucherApi = {
  getAvailableVouchers: async (storeId?: string, orderValue?: number): Promise<BackendVoucher[]> => {
    try {
      const params = new URLSearchParams()
      if (storeId) params.append('storeId', storeId)
      if (orderValue) params.append('orderValue', orderValue.toString())
      const res = await httpClient.get<BackendVoucher[]>(`/vouchers?${params.toString()}`)
      return res.data || []
    } catch {
      return []
    }
  },

  validateVoucher: async (
    code: string,
    orderValueMinor: number,
    storeId?: string
  ): Promise<ValidateVoucherResult | null> => {
    try {
      const res = await httpClient.post<ValidateVoucherResult>('/vouchers/validate', {
        code,
        orderValueMinor,
        storeId,
      })
      return res.data || null
    } catch {
      return null
    }
  },
}
