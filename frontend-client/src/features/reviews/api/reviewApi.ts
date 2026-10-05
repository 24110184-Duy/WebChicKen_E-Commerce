import { httpClient } from '../../../shared/api/httpClient'
import type {
  ReviewResponse,
  ReviewSummaryResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '../types'

const LOCAL_STORAGE_KEY = 'webchicken_local_reviews'

// High-quality mock reviews for test validation before DB connection
const INITIAL_MOCK_REVIEWS: ReviewResponse[] = [
  {
    id: 'rev-mock-1',
    userId: 'user-001',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    orderId: 'ORD-20261002-108234',
    orderItemId: 'item-demo-01',
    productId: 'prod-1',
    rating: 5,
    comment:
      'Free-range chicken is remarkably firm, juicy and fragrant. Roasted with a golden crispy skin that looked and tasted gourmet. Packaged in an insulated thermal box with cold gel ice packs with extraordinary care. Delivered ice cold and fresh. Will definitely order regularly!',
    mediaUrls: [
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    ],
    sellerReply:
      'Chicky Farm Direct sincerely thanks Sarah for trusting our cold-chain certified fresh poultry! Wishing you and your family delightful meals ahead.',
    sellerReplyAt: '2026-10-02T16:45:00Z',
    status: 'APPROVED',
    helpfulCount: 8,
    createdAt: '2026-10-02T15:20:00Z',
    updatedAt: '2026-10-02T15:20:00Z',
  },
  {
    id: 'rev-mock-2',
    userId: 'user-002',
    userName: 'David Miller',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    orderId: 'ORD-20261003-887123',
    orderItemId: 'item-demo-02',
    productId: 'prod-1',
    rating: 5,
    comment:
      'Ordered in the morning, delivered right before lunch! Vacuum sealed cleanly with zero odor. Prepared chili-salt roasted chicken and the meat was succulent and naturally sweet. Excellent value for money!',
    mediaUrls: [
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
    ],
    sellerReply: null,
    sellerReplyAt: null,
    status: 'APPROVED',
    helpfulCount: 5,
    createdAt: '2026-10-03T11:15:00Z',
    updatedAt: '2026-10-03T11:15:00Z',
  },
  {
    id: 'rev-mock-3',
    userId: 'user-003',
    userName: 'Michael Brown',
    userAvatar: null,
    orderId: 'ORD-20261001-445190',
    orderItemId: 'item-demo-03',
    productId: 'prod-1',
    rating: 4,
    comment:
      'Fresh chicken quality is superb, firm texture without getting mushy when boiled. Minus 1 star because delivery courier was 15 minutes late due to heavy storms, but thermal insulation box preserved the meat perfectly cold and fresh.',
    mediaUrls: [],
    sellerReply:
      'Chicky Farm warmly apologizes to Michael for the brief courier delay caused by harsh weather conditions. We will coordinate closely with logistics partners to ensure an even smoother experience next time!',
    sellerReplyAt: '2026-10-01T19:30:00Z',
    status: 'APPROVED',
    helpfulCount: 2,
    createdAt: '2026-10-01T18:00:00Z',
    updatedAt: '2026-10-01T18:00:00Z',
  },
]

function getStoredReviews(): ReviewResponse[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_REVIEWS))
      return INITIAL_MOCK_REVIEWS
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_MOCK_REVIEWS
  }
}

function saveStoredReviews(list: ReviewResponse[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

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
      if (res.data && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Khi không có kết nối DB, tự động chuyển sang chế độ Mock Fallback
    }

    const all = getStoredReviews()
    // Lọc theo productId (nếu không có thì trả về mock mặc định để demo)
    let filtered = all.filter((r) => r.productId === productId || productId === 'prod-1')
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      filtered = filtered.filter((r) => r.rating === ratingFilter)
    }

    const startIndex = (page - 1) * size
    return filtered.slice(startIndex, startIndex + size)
  },

  getProductReviewSummary: async (productId: string): Promise<ReviewSummaryResponse | null> => {
    try {
      const res = await httpClient.get<ReviewSummaryResponse>(`/reviews/products/${productId}/summary`, {
        skipAuth: true,
      })
      if (res.data && res.data.totalReviews > 0) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const all = getStoredReviews()
    const reviews = all.filter((r) => r.productId === productId || productId === 'prod-1')

    const total = reviews.length
    if (total === 0) {
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
    }

    let sum = 0
    let c5 = 0, c4 = 0, c3 = 0, c2 = 0, c1 = 0
    reviews.forEach((r) => {
      sum += r.rating
      if (r.rating === 5) c5++
      else if (r.rating === 4) c4++
      else if (r.rating === 3) c3++
      else if (r.rating === 2) c2++
      else if (r.rating === 1) c1++
    })

    const avg = Math.round((sum / total) * 10) / 10

    return {
      productId,
      averageRating: avg,
      totalReviews: total,
      fiveStarCount: c5,
      fourStarCount: c4,
      threeStarCount: c3,
      twoStarCount: c2,
      oneStarCount: c1,
    }
  },

  createReview: async (data: CreateReviewRequest): Promise<ReviewResponse> => {
    try {
      const res = await httpClient.post<ReviewResponse>('/reviews', data)
      if (res.data) {
        return res.data
      }
    } catch {
      // Fallback: Lưu vào LocalStorage khi chạy không có Backend DB
    }

    // Tạo bản ghi review offline
    const newReview: ReviewResponse = {
      id: `rev-local-${Date.now()}`,
      userId: 'user-current-buyer',
      userName: 'Bạn (Khách hàng)',
      userAvatar: null,
      orderId: data.orderId,
      orderItemId: data.orderItemId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment,
      mediaUrls: data.mediaUrls || [],
      sellerReply: null,
      sellerReplyAt: null,
      status: 'APPROVED',
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const current = getStoredReviews()
    const updated = [newReview, ...current]
    saveStoredReviews(updated)

    return newReview
  },

  updateReview: async (reviewId: string, data: UpdateReviewRequest): Promise<ReviewResponse> => {
    try {
      const res = await httpClient.put<ReviewResponse>(`/reviews/${reviewId}`, data)
      if (res.data) return res.data
    } catch {}

    const list = getStoredReviews()
    const idx = list.findIndex((r) => r.id === reviewId)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        rating: data.rating,
        comment: data.comment,
        mediaUrls: data.mediaUrls || list[idx].mediaUrls,
        updatedAt: new Date().toISOString(),
      }
      saveStoredReviews(list)
      return list[idx]
    }
    throw new Error('Review not found')
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    try {
      await httpClient.delete(`/reviews/${reviewId}`)
    } catch {}

    const list = getStoredReviews().filter((r) => r.id !== reviewId)
    saveStoredReviews(list)
  },

  getMyReviews: async (page: number = 1, size: number = 10): Promise<ReviewResponse[]> => {
    try {
      const res = await httpClient.get<ReviewResponse[]>('/reviews/my', {
        params: { page, size },
      })
      if (res.data && res.data.length > 0) return res.data
    } catch {}

    const all = getStoredReviews()
    return all.slice((page - 1) * size, page * size)
  },
}
