import { httpClient } from '../../../shared/api/httpClient'
import type {
  FeedbackItem,
  FeedbackPageResponse,
  CreateFeedbackPayload,
  RespondFeedbackPayload,
  FeedbackFilterParams,
} from '../types/feedbackTypes'

/**
 * Seller gửi thắc mắc hoặc khiếu nại mới
 */
export async function submitSellerFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
  const resp = await httpClient.post<FeedbackItem>('/api/v1/seller/feedbacks', payload)
  return resp.data
}

/**
 * Lấy danh sách phản hồi của chính người bán (Seller xem lịch sử)
 */
export async function fetchSellerFeedbacks(page: number = 1, size: number = 10): Promise<FeedbackPageResponse> {
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('size', String(size))

  const resp = await httpClient.get<FeedbackPageResponse>(`/api/v1/seller/feedbacks?${query.toString()}`)
  return resp.data || { items: [], total: 0, page, size, totalPages: 0 }
}

/**
 * Admin truy vấn danh sách phản hồi từ các nhà bán
 */
export async function fetchAdminFeedbacks(params: FeedbackFilterParams = {}): Promise<FeedbackPageResponse> {
  const { page = 1, size = 10, status = 'ALL', type = 'ALL', search = '' } = params

  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('size', String(size))
  if (status && status !== 'ALL') query.set('status', status)
  if (type && type !== 'ALL') query.set('type', type)
  if (search && search.trim()) query.set('search', search.trim())

  const resp = await httpClient.get<FeedbackPageResponse>(`/api/v1/admin/feedbacks?${query.toString()}`)
  return resp.data || { items: [], total: 0, page, size, totalPages: 0 }
}

/**
 * Lấy chi tiết một phản hồi
 */
export async function fetchFeedbackDetail(id: string): Promise<FeedbackItem> {
  const resp = await httpClient.get<FeedbackItem>(`/api/v1/admin/feedbacks/${id}`)
  return resp.data
}

/**
 * Admin cập nhật trạng thái và phản hồi khiếu nại
 */
export async function respondToFeedback(id: string, payload: RespondFeedbackPayload): Promise<FeedbackItem> {
  const resp = await httpClient.put<FeedbackItem>(`/api/v1/admin/feedbacks/${id}/respond`, payload)
  return resp.data
}
