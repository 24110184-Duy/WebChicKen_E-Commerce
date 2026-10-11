export type FeedbackType =
  | 'INQUIRY'
  | 'COMPLAINT'
  | 'SUGGESTION'
  | 'SYSTEM_BUG'
  | 'STORE_REPORT'
  | 'PAYMENT'
  | 'OTHER'
export type FeedbackStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface FeedbackItem {
  id: string
  userId: string
  userEmail?: string
  shopName?: string
  senderName?: string
  senderRole?: 'CUSTOMER' | 'SELLER'
  type: FeedbackType
  subject: string
  content: string
  imageUrl?: string
  status: FeedbackStatus
  adminResponse?: string
  resolvedBy?: string
  createdAt: string
  updatedAt?: string
}

export interface FeedbackPageResponse {
  items: FeedbackItem[]
  total: number
  page: number
  size: number
  totalPages: number
}

export interface CreateFeedbackPayload {
  type: FeedbackType
  subject: string
  content: string
  imageUrl?: string
}

export interface RespondFeedbackPayload {
  status: FeedbackStatus
  adminResponse: string
}

export interface FeedbackFilterParams {
  page?: number
  size?: number
  status?: string
  type?: string
  search?: string
}

/**
 * Chuẩn hóa tên Quản Trị Viên giải quyết phiếu phản hồi / khiếu nại.
 * Ngăn chặn việc hiển thị mã định danh UUID thô gây hoang mang cho người dùng.
 */
export const formatAdminResolver = (name?: string): string => {
  if (!name || !name.trim()) return 'Ban Quản trị WebChicKen'
  const trimmed = name.trim()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return 'Ban Quản trị WebChicKen'
  }
  return trimmed
}
