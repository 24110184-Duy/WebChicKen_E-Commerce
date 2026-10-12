import { httpClient } from '../../../shared/api/httpClient'
import type {
  ReviewResponse,
  ReviewSummaryResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '../types'

export const reviewApi = {
  getProductReviews: async (
    productId: string,
    ratingFilter?: number,
    page: number = 1,
    size: number = 10
  ): Promise<ReviewResponse[]> => {
    try {
      const params: Record<string, string | number> = { page, size }
      if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
        params.rating = ratingFilter
      }
      const res = await httpClient.get<ReviewResponse[]>(`/reviews/products/${productId}`, {
        params,
        skipAuth: true,
      })
      return res.data || []
    } catch {
      return []
    }
  },

  getProductReviewSummary: async (productId: string): Promise<ReviewSummaryResponse | null> => {
    try {
      const res = await httpClient.get<ReviewSummaryResponse>(`/reviews/products/${productId}/summary`, {
        skipAuth: true,
      })
      if (res.data) {
        return res.data
      }
    } catch {
      // Return zero summary if not found or no reviews
    }

    return {
      productId,
      averageRating: 0.0,
      totalReviews: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
    }
  },

  createReview: async (data: CreateReviewRequest): Promise<ReviewResponse> => {
    const res = await httpClient.post<ReviewResponse>('/reviews', data)
    if (res.data) {
      return res.data
    }
    throw new Error('Failed to create review')
  },

  updateReview: async (reviewId: string, data: UpdateReviewRequest): Promise<ReviewResponse> => {
    const res = await httpClient.put<ReviewResponse>(`/reviews/${reviewId}`, data)
    if (res.data) return res.data
    throw new Error('Failed to update review')
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await httpClient.delete(`/reviews/${reviewId}`)
  },

  getMyReviews: async (page: number = 1, size: number = 10): Promise<ReviewResponse[]> => {
    try {
      const res = await httpClient.get<ReviewResponse[]>('/reviews/my', {
        params: { page, size },
      })
      return res.data || []
    } catch {
      return []
    }
  },
}
