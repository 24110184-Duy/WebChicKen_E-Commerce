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

/**
 * Computes HMAC-SHA512 digest using native browser Web Crypto API.
 */
async function computeHmacSha512(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Fallback sandbox URL generator if backend servlet is offline during frontend preview.
 */
async function generateClientFallbackVNPayUrl(orderCode: string, amountMinor: number): Promise<string> {
  const tmnCode = 'NPV0WRB3'
  const hashSecret = 'XDYQCWUMBVXKGOYLTEFJNAPKPJKRYOMV'
  const payUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
  const returnUrl = `${window.location.origin}/buyer/payment/result`

  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const createDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const expire = new Date(now.getTime() + 15 * 60 * 1000)
  const expireDate = `${expire.getFullYear()}${pad(expire.getMonth() + 1)}${pad(expire.getDate())}${pad(expire.getHours())}${pad(expire.getMinutes())}${pad(expire.getSeconds())}`

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: (amountMinor * 100).toString(),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderCode,
    vnp_OrderInfo: `Payment for order ${orderCode}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  }

  const encodeVNPay = (v: string) => encodeURIComponent(v).replace(/%20/g, '+')
  const sortedKeys = Object.keys(params).sort()
  const signData = sortedKeys.map((k) => `${k}=${encodeVNPay(params[k])}`).join('&')
  const query = sortedKeys.map((k) => `${encodeVNPay(k)}=${encodeVNPay(params[k])}`).join('&')
  const secureHash = await computeHmacSha512(hashSecret, signData)

  return `${payUrl}?${query}&vnp_SecureHash=${secureHash}`
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

  createVNPayUrl: async (orderCode: string, amountMinor: number = 370000): Promise<string | null> => {
    try {
      const res = await httpClient.post<PaymentUrlResponse>('/payments/vnpay/create-url', { orderCode })
      if (res.data?.paymentUrl) {
        return res.data.paymentUrl
      }
      return await generateClientFallbackVNPayUrl(orderCode, amountMinor)
    } catch {
      console.warn('[Mock/Fallback] Backend offline, generating direct VNPay Sandbox URL')
      return await generateClientFallbackVNPayUrl(orderCode, amountMinor)
    }
  },
}
