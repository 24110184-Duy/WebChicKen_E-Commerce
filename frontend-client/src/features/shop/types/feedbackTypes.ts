export type FeedbackType = 'INQUIRY' | 'COMPLAINT' | 'SUGGESTION' | 'SYSTEM_BUG' | 'OTHER'
export type FeedbackStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface FeedbackItem {
  id: string
  userId: string
  userEmail?: string
  shopName?: string
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
