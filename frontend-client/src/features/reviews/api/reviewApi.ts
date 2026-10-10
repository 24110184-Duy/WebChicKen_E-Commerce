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
      'Tai nghe đeo rất êm tai, chống ồn chủ động ANC cực đỉnh trong tầm giá. Âm bass chắc khỏe, pin trâu dùng cả ngày không hết. Đóng gói hộp nguyên seal cẩn thận, giao hàng siêu nhanh!',
    mediaUrls: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    ],
    sellerReply:
      'TechZone Official chân thành cảm ơn bạn đã tin tưởng ủng hộ sản phẩm chính hãng! Chúc bạn có những phút giây trải nghiệm âm nhạc thật tuyệt vời.',
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
      'Đặt sáng chiều nhận được luôn. Sản phẩm hoàn thiện cao cấp, kết nối Bluetooth tức thì với cả điện thoại và laptop. Rất đáng đồng tiền bát gạo!',
    mediaUrls: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
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
      'Chất lượng âm thanh xuất sắc trong phân khúc. Trừ 1 sao do bên vận chuyển giao trễ 1 chút vì mưa to, nhưng shop bọc chống sốc 2 lớp rất kỹ càng nên hộp còn nguyên vẹn không móp méo.',
    mediaUrls: [],
    sellerReply:
      'TechZone chân thành xin lỗi quý khách vì đơn vị vận chuyển giao trễ do thời tiết xấu. Shop sẽ phối hợp chặt chẽ hơn với bưu cục để đơn hàng sau đến tay bạn nhanh nhất!',
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
