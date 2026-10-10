import React, { useEffect, useState, useMemo } from 'react'
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Camera,
} from 'lucide-react'
import { reviewApi } from '../api/reviewApi'
import type { ReviewResponse, ReviewSummaryResponse } from '../types'

export interface ProductReviewsProps {
  productId: string
  productTitle?: string
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productTitle }) => {
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined)
  const [onlyWithMedia, setOnlyWithMedia] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [helpfulMap, setHelpfulMap] = useState<Record<string, number>>({})
  const [hasVotedMap, setHasVotedMap] = useState<Record<string, boolean>>({})

  const pageSize = 5

  // 1. Fetch Summary
  useEffect(() => {
    let isMounted = true
    reviewApi.getProductReviewSummary(productId).then((res) => {
      if (isMounted && res) {
        setSummary(res)
      }
    })
    return () => {
      isMounted = false
    }
  }, [productId])

  // 2. Fetch Reviews according to filter & page
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    reviewApi
      .getProductReviews(productId, selectedRating, page, pageSize)
      .then((res) => {
        if (isMounted) {
          setReviews(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews([])
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [productId, selectedRating, page])

  const totalReviews = summary?.totalReviews || 0
  const averageRating = summary?.averageRating || 0.0

  const handleToggleHelpful = (reviewId: string, initialCount: number) => {
    if (hasVotedMap[reviewId]) {
      setHelpfulMap((prev) => ({ ...prev, [reviewId]: (prev[reviewId] ?? initialCount) - 1 }))
      setHasVotedMap((prev) => ({ ...prev, [reviewId]: false }))
    } else {
      setHelpfulMap((prev) => ({ ...prev, [reviewId]: (prev[reviewId] ?? initialCount) + 1 }))
      setHasVotedMap((prev) => ({ ...prev, [reviewId]: true }))
    }
  }

  const formatReviewDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Filter reviews with media if toggled
  const displayedReviews = useMemo(() => {
    if (!onlyWithMedia) return reviews
    return reviews.filter((r) => r.mediaUrls && r.mediaUrls.length > 0)
  }, [reviews, onlyWithMedia])

  const mediaCount = useMemo(() => {
    return reviews.filter((r) => r.mediaUrls && r.mediaUrls.length > 0).length
  }, [reviews])

  const currentCategoryCount = useMemo(() => {
    if (selectedRating === 5) return summary?.fiveStarCount || 0
    if (selectedRating === 4) return summary?.fourStarCount || 0
    if (selectedRating === 3) return summary?.threeStarCount || 0
    if (selectedRating === 2) return summary?.twoStarCount || 0
    if (selectedRating === 1) return summary?.oneStarCount || 0
    return totalReviews
  }, [selectedRating, summary, totalReviews])

  const totalPages = Math.max(1, Math.ceil(currentCategoryCount / pageSize))

  return (
    <div className="shopee-review-card">
      {/* Header */}
      <div className="shopee-review-header">
        <span>PRODUCT REVIEWS & RATINGS {productTitle ? `— ${productTitle}` : ''}</span>
        {totalReviews > 0 && (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#d97706', textTransform: 'none' }}>
            {totalReviews} verified customer review{totalReviews > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Shopee Style Overview Banner */}
      <div className="shopee-overview-box">
        {/* Left Column: Big Score */}
        <div className="shopee-score-col">
          <div className="shopee-score-num">
            {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
            <span> out of 5</span>
          </div>
          <div className="shopee-score-stars">
            {[1, 2, 3, 4, 5].map((s) => {
              const fillScore = averageRating > 0 ? averageRating : 5
              return (
                <Star
                  key={s}
                  style={{
                    width: 20,
                    height: 20,
                    color: s <= Math.round(fillScore) ? '#f59e0b' : '#e2e8f0',
                    fill: s <= Math.round(fillScore) ? '#f59e0b' : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Right Column: Filter Chips */}
        <div className="shopee-filters-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedRating(undefined)
              setOnlyWithMedia(false)
              setPage(1)
            }}
            className={`shopee-filter-chip ${selectedRating === undefined && !onlyWithMedia ? 'active' : ''}`}
          >
            All ({totalReviews})
          </button>

          {[5, 4, 3, 2, 1].map((star) => {
            let count = 0
            if (star === 5) count = summary?.fiveStarCount || 0
            else if (star === 4) count = summary?.fourStarCount || 0
            else if (star === 3) count = summary?.threeStarCount || 0
            else if (star === 2) count = summary?.twoStarCount || 0
            else if (star === 1) count = summary?.oneStarCount || 0

            return (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setSelectedRating(star)
                  setOnlyWithMedia(false)
                  setPage(1)
                }}
                className={`shopee-filter-chip ${selectedRating === star && !onlyWithMedia ? 'active' : ''}`}
              >
                <span>{star} Star{star > 1 ? 's' : ''}</span>
                <span style={{ opacity: 0.85 }}>({count})</span>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => {
              setOnlyWithMedia(true)
              setSelectedRating(undefined)
              setPage(1)
            }}
            className={`shopee-filter-chip ${onlyWithMedia ? 'active' : ''}`}
          >
            <Camera style={{ width: 14, height: 14 }} />
            <span>With Photos ({mediaCount})</span>
          </button>
        </div>
      </div>

      {/* Review List */}
      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          Loading customer reviews...
        </div>
      ) : displayedReviews.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fafafa', borderRadius: 12 }}>
          <Sparkles style={{ width: 40, height: 40, color: '#f59e0b', margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            {selectedRating ? `No ${selectedRating}-star reviews yet` : 'No reviews yet for this product'}
          </h4>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Order now and be the first to leave a review and earn 200 ChickyCoins in reward points!
          </p>
        </div>
      ) : (
        <div>
          {displayedReviews.map((rev) => {
            const currentHelpful = helpfulMap[rev.id] ?? rev.helpfulCount
            const hasVoted = hasVotedMap[rev.id] ?? false

            return (
              <div key={rev.id} className="shopee-review-item">
                {/* Avatar */}
                {rev.userAvatar ? (
                  <img src={rev.userAvatar} alt={rev.userName} className="shopee-reviewer-avatar" />
                ) : (
                  <div className="shopee-reviewer-avatar">
                    {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                {/* Content */}
                <div className="shopee-review-content">
                  <div className="shopee-reviewer-name">{rev.userName || 'WebChicKen Customer'}</div>

                  {/* Stars */}
                  <div className="shopee-review-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        style={{
                          width: 14,
                          height: 14,
                          color: s <= rev.rating ? '#f59e0b' : '#e2e8f0',
                          fill: s <= rev.rating ? '#f59e0b' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  {/* Meta: time + verified */}
                  <div className="shopee-review-meta">
                    <span>{formatReviewDate(rev.createdAt)}</span>
                    <span className="divider" />
                    <span>Variant: Fresh Cold-Chain Cut</span>
                    <span className="divider" />
                    <span className="verified">
                      <CheckCircle2 style={{ width: 13, height: 13 }} /> Verified Purchase
                    </span>
                  </div>

                  {/* Comment Text */}
                  <div className="shopee-review-comment">{rev.comment}</div>

                  {/* Media Gallery (Shopee Style Thumbnails) */}
                  {rev.mediaUrls && rev.mediaUrls.length > 0 && (
                    <div className="shopee-review-gallery">
                      {rev.mediaUrls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(url)}
                          className="shopee-review-thumb-btn"
                        >
                          <img src={url} alt={`Review Media ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Seller Reply Card */}
                  {rev.sellerReply && (
                    <div className="shopee-seller-reply-card">
                      <div className="shopee-seller-reply-title">
                        <MessageSquare style={{ width: 14, height: 14 }} />
                        <span>Seller Response</span>
                      </div>
                      <div className="shopee-seller-reply-text">{rev.sellerReply}</div>
                    </div>
                  )}

                  {/* Helpful Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(rev.id, rev.helpfulCount)}
                      className={`shopee-helpful-btn ${hasVoted ? 'voted' : ''}`}
                    >
                      <ThumbsUp style={{ width: 13, height: 13 }} />
                      <span>Helpful ({currentHelpful})</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', padding: '0 8px' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}

      {/* Lightbox / Zoom Image Modal */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '800px', maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Zoomed Review Media"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                border: 'none',
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default ProductReviews
