/**
 * Định dạng tiền tệ VNĐ thống nhất toàn hệ thống.
 * Quy định tại CODE_PRINCIPLES REU-07
 */
export function formatMoney(amountMinor: number | bigint, currency = 'VND'): string {
  const amount = Number(amountMinor)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
