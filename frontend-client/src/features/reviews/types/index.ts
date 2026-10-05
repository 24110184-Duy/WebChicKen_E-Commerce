export interface ReviewResponse {
  id: string
  userId: string
  userName: string
  userAvatar?: string | null
  orderId: string
  orderItemId: string
  productId: string
  rating: number
  comment: string
  mediaUrls: string[]
  sellerReply?: string | null
  sellerReplyAt?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

export interface ReviewSummaryResponse {
  productId: string
  averageRating: number
  totalReviews: number
  fiveStarCount: number
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
}

export interface CreateReviewRequest {
  orderId: string
  orderItemId: string
  productId: string
  rating: number
  comment: string
  mediaUrls?: string[]
}

export interface UpdateReviewRequest {
  rating: number
  comment: string
  mediaUrls?: string[]
}
