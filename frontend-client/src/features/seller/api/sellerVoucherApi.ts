import { httpClient } from '../../../shared/api/httpClient'
import type { AdminVoucherItem, CreateVoucherPayload } from '../../admin/types/voucherTypes'

export const sellerVoucherApi = {
  fetchSellerVouchers: async (storeId: string): Promise<AdminVoucherItem[]> => {
    try {
      const resp = await httpClient.get<AdminVoucherItem[]>(`/vouchers?all=true&storeId=${encodeURIComponent(storeId)}`)
      if (resp.data && Array.isArray(resp.data)) return resp.data
    } catch (err) {
      console.warn('Lỗi tải danh sách voucher của gian hàng:', err)
    }
    return []
  },

  createSellerVoucher: async (payload: CreateVoucherPayload): Promise<AdminVoucherItem> => {
    const resp = await httpClient.post<AdminVoucherItem>('/vouchers', payload)
    return resp.data
  },

  toggleVoucherStatus: async (id: string): Promise<AdminVoucherItem> => {
    const resp = await httpClient.post<AdminVoucherItem>(`/vouchers/${id}/toggle`)
    return resp.data
  },

  deleteVoucher: async (id: string): Promise<void> => {
    await httpClient.delete(`/vouchers/${id}`)
  }
}
