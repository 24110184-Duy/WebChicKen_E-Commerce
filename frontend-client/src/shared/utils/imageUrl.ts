/**
 * Tiện ích đồng bộ hóa và xử lý đường dẫn hình ảnh trên toàn hệ thống WebChicKen.
 */

export const DEFAULT_PRODUCT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'

export const DEFAULT_AVATAR_PLACEHOLDER =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'

/**
 * Chuẩn hóa và giải quyết đường dẫn hình ảnh (từ backend, blob preview, hoặc external URL).
 */
export function resolveImageUrl(
  url?: string | null,
  type: 'product' | 'avatar' = 'product'
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return type === 'avatar' ? DEFAULT_AVATAR_PLACEHOLDER : DEFAULT_PRODUCT_PLACEHOLDER
  }

  const clean = url.trim()

  // Blob preview hoặc base64
  if (clean.startsWith('blob:') || clean.startsWith('data:')) {
    return clean
  }

  // URL tuyệt đối (http/https)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean
  }

  // Đường dẫn tương đối từ máy chủ API (/api/...)
  if (clean.startsWith('/api/')) {
    return clean
  }

  // Nếu chỉ truyền tên tệp (uuid.png), chuẩn hóa về endpoint /api/v1/media/files/
  if (clean.startsWith('media/files/')) {
    return `/api/v1/${clean}`
  }
  if (!clean.includes('/')) {
    return `/api/v1/media/files/${clean}`
  }

  return clean.startsWith('/') ? clean : `/${clean}`
}

/**
 * Hàm xử lý lỗi khi ảnh không tải được (onError fallback).
 * Tự động thay thế bằng ảnh dự phòng chất lượng cao và ngăn chặn vòng lặp lặp lại.
 */
export function handleImageFallback(
  e: React.SyntheticEvent<HTMLImageElement>,
  type: 'product' | 'avatar' = 'product'
) {
  const target = e.currentTarget
  const fallback = type === 'avatar' ? DEFAULT_AVATAR_PLACEHOLDER : DEFAULT_PRODUCT_PLACEHOLDER
  if (target.src !== fallback) {
    target.src = fallback
  }
}
