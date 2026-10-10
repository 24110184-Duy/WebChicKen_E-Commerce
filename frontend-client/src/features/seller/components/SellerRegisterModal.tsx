import React, { useState } from 'react'
import { ImageUploader } from '../../../components/molecules/ImageUploader'
import { sellerApi, type SellerApplicationResponse } from '../api/sellerApi'

export interface SellerRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (app: SellerApplicationResponse) => void
}

export const SellerRegisterModal: React.FC<SellerRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [shopName, setShopName] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!shopName.trim()) {
      setError('Please enter your shop name.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await sellerApi.applySeller({
        shopName: shopName.trim(),
        documentUrl: documentUrl || undefined,
        taxCode: taxCode.trim() || undefined,
      })
      setIsSuccess(true)
      onSuccess?.(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Register as ChickyMart Seller</h3>
          <button type="button" onClick={onClose} className="modal-close-text">
            Close
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {isSuccess ? (
            <div className="modal-success-box">
              <span className="modal-success-tag">COMPLETED</span>
              <h4 className="modal-success-title">Application Submitted</h4>
              <p className="modal-success-desc">
                Your application for <strong>{shopName}</strong> has been submitted. Our team will review and respond within 24 business hours.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-modal-submit"
                style={{ width: '100%', height: 40 }}
              >
                Done and Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div className="modal-error-box">
                  {error}
                </div>
              )}

              <div className="profile-form-group">
                <label className="profile-label">
                  Shop / Brand Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. TechZone Official Store, Anker Flagship Store"
                  className="profile-input"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label className="profile-label">
                  Tax Code / Business Registration Number (Optional)
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  placeholder="Enter tax code for invoice issuance"
                  className="profile-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="profile-form-group">
                <ImageUploader
                  label="Business License / National ID Document"
                  hint="Upload high resolution photo in JPG, PNG, or WEBP format (Max 5MB)"
                  value={documentUrl}
                  onChange={(url) => setDocumentUrl(url)}
                  onRemove={() => setDocumentUrl('')}
                  aspectRatio="video"
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-notice">
                Notice: By submitting this application, you agree to comply with ChickyMart Marketplace seller standards, return policies, and consumer protection terms.
              </div>

              <div className="modal-footer" style={{ padding: '16px 0 0', margin: 0 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-modal-submit"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
