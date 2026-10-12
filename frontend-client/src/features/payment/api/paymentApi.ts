import { httpClient } from '../../../shared/api/httpClient'

export interface PaymentUrlResponse {
  orderCode: string
  amountMinor: number
  paymentUrl: string
}

export interface PaymentMethod {
  code: string
  name: string
  description: string
  isDefault: boolean
}

export const paymentApi = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const res = await httpClient.get<PaymentMethod[]>('/payment-methods')
      return res.data || []
    } catch {
      return [
        {
          code: 'COD',
          name: 'Cash on Delivery (COD)',
          description: 'Pay cash upon delivery',
          isDefault: true,
        },
        {
          code: 'BANK_TRANSFER',
          name: 'VietQR / Bank Transfer',
          description: 'Instant verification via QR code',
          isDefault: false,
        },
        {
          code: 'VNPAY',
          name: 'VNPAY-QR / Online Payment (Sandbox)',
          description: 'Pay securely via ATM Card, VietQR, or Visa/MasterCard',
          isDefault: false,
        },
      ]
    }
  },

  createVNPayUrl: async (orderCode: string): Promise<string | null> => {
    try {
      const res = await httpClient.post<PaymentUrlResponse>('/payments/vnpay/create-url', { orderCode })
      if (res.data?.paymentUrl) {
        return res.data.paymentUrl
      }
      return null
    } catch (err) {
      console.error('Lỗi khi tạo liên kết thanh toán VNPay từ máy chủ:', err)
      return null
    }
  },
}
