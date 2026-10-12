/**
 * Tiện ích định dạng ngày giờ thống nhất toàn hệ thống WebChicKen.
 * Tuân thủ CODE_PRINCIPLES REU-01 và README.md mục 5.3
 */

export function formatDate(dateInput?: string | Date | null, fallback = '—'): string {
  if (!dateInput) return fallback
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return String(dateInput)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateInput?: string | Date | null, fallback = '—'): string {
  if (!dateInput) return fallback
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return String(dateInput)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatTimeAgo(dateInput?: string | Date | null): string {
  if (!dateInput) return ''
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diffSec < 60) return 'Vừa xong'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`
  return `${Math.floor(diffSec / 86400)} ngày trước`
}
