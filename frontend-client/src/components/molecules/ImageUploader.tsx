import React, { useState, useRef } from 'react'
import { httpClient } from '../../shared/api/httpClient'

export interface ImageUploaderProps {
  value?: string
  onChange?: (url: string) => void
  onRemove?: () => void
  label?: string
  hint?: string
  maxSizeMB?: number
  disabled?: boolean
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
}

interface UploadResponse {
  id: string
  fileName: string
  fileUrl: string
  contentType: string
  fileSize: number
  createdAt: string
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onRemove,
  label = 'Upload Image',
  hint = 'JPEG, PNG, WEBP formats (Max 5MB)',
  maxSizeMB = 5,
  disabled = false,
  className = '',
  aspectRatio = 'square',
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentImage = localPreview || value

  const handleFileSelection = async (file: File) => {
    setError(null)

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file format. Please upload JPG, PNG, or WEBP image.')
      return
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await httpClient.post<UploadResponse>('/media/upload', formData)
      const uploadedUrl = res.data?.fileUrl || previewUrl
      onChange?.(uploadedUrl)
    } catch (err: any) {
      console.warn('[ImageUploader] Upload failed, falling back to local preview:', err)
      onChange?.(previewUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isUploading) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalPreview(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRemove?.()
    onChange?.('')
  }

  return (
    <div className={`image-uploader-wrapper ${className}`}>
      {label && <label className="image-uploader-label">{label}</label>}

      <div
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`image-uploader-dropzone aspect-${aspectRatio} ${
          isDragging ? 'dragging' : ''
        } ${disabled ? 'disabled' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          disabled={disabled || isUploading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelection(e.target.files[0])
            }
          }}
        />

        {currentImage ? (
          <div className="image-uploader-preview">
            <img src={currentImage} alt="Uploaded preview" className="image-uploader-img" />
            <div className="image-uploader-overlay">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsLightboxOpen(true)
                }}
                className="image-uploader-btn-view"
              >
                View Full Size
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="image-uploader-btn-change"
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="image-uploader-btn-remove"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="image-uploader-placeholder">
            <span className="image-uploader-tag">UPLOAD</span>
            <span className="image-uploader-title">Drag and drop image here</span>
            <span className="image-uploader-subtitle">
              or <span className="image-uploader-link">browse from device</span>
            </span>
          </div>
        )}

        {isUploading && (
          <div className="image-uploader-loading">
            <span>Uploading file...</span>
          </div>
        )}
      </div>

      {currentImage && (
        <div className="image-uploader-actions-bar">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="image-uploader-link-btn"
          >
            View Full Size
          </button>
        </div>
      )}

      {hint && !error && <span className="image-uploader-hint">{hint}</span>}
      {error && <span className="image-uploader-error">{error}</span>}

      {/* Lightbox / Full size viewer */}
      {isLightboxOpen && currentImage && (
        <div className="modal-overlay" onClick={() => setIsLightboxOpen(false)} style={{ zIndex: 1000 }}>
          <div
            className="modal-box"
            style={{ maxWidth: '90vw', width: 'auto', maxHeight: '90vh', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Image Details</h3>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="modal-close-text"
              >
                Close
              </button>
            </div>
            <div
              style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#0f172a',
                maxHeight: 'calc(90vh - 65px)',
                overflow: 'auto',
              }}
            >
              <img
                src={currentImage}
                alt="Full size view"
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
