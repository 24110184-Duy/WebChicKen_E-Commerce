import React, { useState, useRef } from 'react'
import {
  Star,
  X,
  Camera,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'
import { reviewApi } from '../api/reviewApi'
import type { ReviewResponse } from '../types'

export interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (review: ReviewResponse) => void
  orderId: string
  orderItemId: string
  productId: string
  productName: string
  productImage?: string
  variantName?: string
}

const MAX_WORDS = 2000

const RATING_EMOTIONS: Record<number, string> = {
  1: 'Very Poor (1 Star)',
  2: 'Poor (2 Stars)',
  3: 'Average (3 Stars)',
  4: 'Good (4 Stars)',
  5: 'Excellent (5 Stars)',
}

const QUICK_TAGS = [
  '✨ Sản phẩm chính hãng 100%',
  '📦 Đóng gói cẩn thận, chắc chắn',
  '⚡ Giao hàng siêu nhanh',
  '💰 Đáng tiền, giá cả cạnh tranh',
  '⭐ Chất lượng vượt mong đợi',
  '👍 Shop phục vụ nhiệt tình, chu đáo',
]

const countWords = (text: string): number => {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  orderItemId,
  productId,
  productName,
  productImage,
  variantName,
}) => {
  // Star rating: Click to select stars (1 to 5)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // File input ref for local OS file picking
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const wordCount = countWords(comment)
  const isOverWordLimit = wordCount > MAX_WORDS

  // Handle local image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setErrorMessage(null)
    const remainingSlots = 5 - mediaUrls.length
    if (remainingSlots <= 0) {
      setErrorMessage('You can upload a maximum of 5 images.')
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    const validFiles = filesToProcess.filter((file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // Max 5MB
      return isValidType && isValidSize
    })

    if (validFiles.length < filesToProcess.length) {
      setErrorMessage('Some files are invalid (only JPG, PNG, WEBP, GIF under 5MB allowed).')
    }

    let loadedCount = 0
    const loadedDataUrls: string[] = []

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string
        if (result) {
          loadedDataUrls.push(result)
        }
        loadedCount++
        if (loadedCount === validFiles.length) {
          setMediaUrls((prev) => [...prev, ...loadedDataUrls].slice(0, 5))
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddQuickTag = (tag: string) => {
    if (comment.includes(tag)) return
    setComment((prev) => (prev ? `${prev.trim()}, ${tag}` : tag))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating (1 to 5 stars).')
      return
    }
    if (!comment.trim()) {
      setErrorMessage('Please write your review comment.')
      return
    }
    if (isOverWordLimit) {
      setErrorMessage(`Review cannot exceed ${MAX_WORDS.toLocaleString()} words. Currently at ${wordCount.toLocaleString()} words.`)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const created = await reviewApi.createReview({
        orderId,
        orderItemId,
        productId,
        rating,
        comment: comment.trim(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      })
      onSuccess(created)
      onClose()
    } catch (err: any) {
      const msg = err?.message || 'An error occurred while submitting your review.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasEnoughWords = wordCount >= 10
  const hasMedia = mediaUrls.length >= 1
  const isRewardUnlocked = hasEnoughWords && hasMedia

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div className="review-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 1. Header (Shopee style with back button & action) */}
        <div className="review-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="review-modal-close-btn"
              title="Close"
            >
              <ArrowLeft style={{ width: 18, height: 18 }} />
            </button>
            <div>
              <h3 className="review-modal-title">Product Review</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Order Code: #{orderId}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !comment.trim() || isOverWordLimit}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              backgroundColor: comment.trim() && !isOverWordLimit ? '#f59e0b' : '#f1f5f9',
              color: comment.trim() && !isOverWordLimit ? '#0f172a' : '#94a3b8',
              cursor: comment.trim() && !isOverWordLimit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
              border: 'none',
            }}
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
          </button>
        </div>

        {/* 2. Coin Reward Banner */}
        <div className="review-incentive-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="review-coin-icon">Coins</span>
            <span>Review to earn up to <strong>200 ChickyCoins</strong> in reward points!</span>
          </div>
          <ChevronRight style={{ width: 16, height: 16, color: '#b45309' }} />
        </div>

        {/* 3. Product Info Bar */}
        <div className="review-product-bar">
          <img
            src={productImage || '/placeholder-product.png'}
            alt={productName}
            className="review-product-img"
          />
          <div className="review-product-info">
            <h4 className="review-product-name">{productName}</h4>
            {variantName && <div className="review-product-variant">Variant: {variantName}</div>}
            <div className="review-product-badge">
              <CheckCircle2 style={{ width: 12, height: 12 }} /> Verified Purchase from WebChicKen
            </div>
          </div>
        </div>

        {/* 4. Modal Scrollable Body */}
        <div className="review-modal-body">
          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                fontSize: 12,
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Shopee Big Stars Row: Click to select rating */}
          <div className="review-rating-box">
            <div
              className="review-stars-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= rating
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="review-star-btn"
                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <Star
                      size={36}
                      strokeWidth={1.5}
                      style={{
                        width: 36,
                        height: 36,
                        color: isFilled ? '#f59e0b' : '#d1d5db',
                        fill: isFilled ? '#f59e0b' : 'none',
                        display: 'block',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  </button>
                )
              })}
            </div>
            <div className="review-rating-label">
              {RATING_EMOTIONS[rating] || ''}
            </div>
          </div>

          {/* Media Upload: Select photos from local disk */}
          <div className="review-media-section">
            <div className="review-media-label">Product Photos ({mediaUrls.length}/5)</div>

            {/* Hidden native file input triggered by camera box click */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div className="review-media-grid">
              {/* Existing Uploaded Thumbnails */}
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="review-media-thumb">
                  <img src={url} alt={`Photo ${idx + 1}`} />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="review-media-remove-btn"
                    title="Remove this photo"
                  >
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              ))}

              {/* Add Photo Box */}
              {mediaUrls.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="review-upload-box"
                  title="Click to select photos from your device"
                >
                  <Camera style={{ width: 24, height: 24, color: '#f59e0b' }} />
                  <span>{mediaUrls.length}/5</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Add Photos</span>
                </button>
              )}
            </div>
          </div>

          {/* Comment Textarea: Multi-line expanded, up to 2,000 words */}
          <div className="review-textarea-wrap">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              placeholder="Chia sẻ chi tiết trải nghiệm của bạn về sản phẩm (chất lượng thực tế, độ hoàn thiện, tính năng, tốc độ giao hàng, đóng gói kiện hàng, dịch vụ hỗ trợ của shop...)"
              className="review-textarea"
            />
            <div className="review-textarea-footer">
              <div className={`review-reward-hint ${isRewardUnlocked ? 'achieved' : ''}`}>
                {isRewardUnlocked ? (
                  <>
                    <Sparkles style={{ width: 14, height: 14 }} />
                    <span>Eligible for 200 ChickyCoins! ✨</span>
                  </>
                ) : (
                  <span>
                    Add {Math.max(0, 10 - wordCount)} words and {Math.max(0, 1 - mediaUrls.length)} photo to earn 200 Coins
                  </span>
                )}
              </div>
              <span className={`review-char-count ${isOverWordLimit ? 'warning' : ''}`}>
                {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
              </span>
            </div>
          </div>

          {/* Quick Suggestion Tags */}
          <div className="review-quick-tags">
            <div className="review-quick-tags-title">Quick review suggestions:</div>
            <div className="review-pills-row">
              {QUICK_TAGS.map((tag, idx) => {
                const isSelected = comment.includes(tag)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddQuickTag(tag)}
                    className={`review-pill-btn ${isSelected ? 'selected' : ''}`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Anonymous Review Switch */}
          <div className="review-anonymous-row">
            <div className="review-anonymous-info">
              <h5>Anonymous Review</h5>
              <p>
                Your username will appear as <strong>{isAnonymous ? 'u***r' : 'You (Customer)'}</strong> on the public product page
              </p>
            </div>
            <label className="review-switch">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span className="review-slider" />
            </label>
          </div>
        </div>

        {/* 5. Footer Actions */}
        <div className="review-modal-footer">
          <button type="button" onClick={onClose} className="review-cancel-btn">
            Maybe Later
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !comment.trim() || isOverWordLimit}
            className="review-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                <span>Submitting Review...</span>
              </>
            ) : (
              <span>Submit Review Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
export default ReviewModal
