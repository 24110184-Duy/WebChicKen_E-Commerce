/**
 * ApiResponse & ApiError interfaces matching Backend format.
 * Quy định tại ARCHITECTURE.md 3.3
 */

export interface PageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  nextCursor?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  meta?: PageMeta
  requestId?: string
  timestamp?: string
}

export interface ValidationErrorDetail {
  field: string
  reason: string
  rejectedValue?: unknown
}

export interface ApiError {
  code: string
  message: string
  details?: ValidationErrorDetail[]
  requestId?: string
  timestamp?: string
  path?: string
}
