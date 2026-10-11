import React, { useState, useEffect } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ExternalLink,
  Download,
  AlertCircle
} from 'lucide-react'

export interface ImageLightboxModalProps {
  isOpen: boolean
  imageUrl: string | null
  title?: string
  onClose: () => void
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title = 'Ảnh Minh Chứng',
  onClose
}) => {
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [loadError, setLoadError] = useState<boolean>(false)

  // Reset state when modal opens or url changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setLoadError(false)
    }
  }, [isOpen, imageUrl])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(z + 0.25, 3))
      } else if (e.key === '-' || e.key === '_') {
        setZoom((z) => Math.max(z - 0.25, 0.5))
      } else if (e.key === '0') {
        setZoom(1)
        setRotation(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      {/* Top Header & Toolbar */}
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          padding: '10px 16px',
          backgroundColor: 'rgba(30, 41, 59, 0.75)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#f8fafc',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 9999,
              backgroundColor: 'rgba(59, 130, 246, 0.25)',
              color: '#93c5fd',
              border: '1px solid rgba(147, 197, 253, 0.3)'
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Zoom Out */}
          <button
            type="button"
            title="Thu nhỏ (-)"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            style={{
              padding: 7,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: zoom <= 0.5 ? '#64748b' : '#f8fafc',
              cursor: zoom <= 0.5 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
          >
            <ZoomOut size={16} />
          </button>

          {/* Zoom In */}
          <button
            type="button"
            title="Phóng to (+)"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            style={{
              padding: 7,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: zoom >= 3 ? '#64748b' : '#f8fafc',
              cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
          >
            <ZoomIn size={16} />
          </button>

          {/* Rotate */}
          <button
            type="button"
            title="Xoay 90 độ"
            onClick={handleRotate}
            style={{
              padding: 7,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCw size={16} />
          </button>

          {/* Reset Zoom */}
          <button
            type="button"
            title="Đặt lại kích thước gốc (0)"
            onClick={handleReset}
            style={{
              padding: 7,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCcw size={16} />
          </button>

          <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 4px' }} />

          {/* Open in new tab */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            title="Mở ảnh gốc trong tab mới"
            style={{
              padding: 7,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ExternalLink size={16} />
          </a>

          {/* Download button */}
          <a
            href={imageUrl}
            download="minh-chung.jpg"
            target="_blank"
            rel="noreferrer"
            title="Tải ảnh về máy"
            style={{
              padding: 7,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Download size={16} />
          </a>

          {/* Close button */}
          <button
            type="button"
            title="Đóng (Esc)"
            onClick={onClose}
            style={{
              padding: 7,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4
            }}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Main Image Canvas */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: 16
        }}
        onClick={onClose}
      >
        {loadError ? (
          <div
            style={{
              padding: '24px 32px',
              borderRadius: 14,
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              color: '#f87171',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle size={36} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>Không thể tải ảnh minh chứng</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              Đường dẫn ảnh có thể bị hỏng hoặc máy chủ lưu trữ tạm thời không phản hồi.
            </div>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                color: '#60a5fa',
                marginTop: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>Thử mở trực tiếp liên kết</span>
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-block',
              transition: 'transform 0.15s ease-out',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={title}
              onError={() => setLoadError(true)}
              style={{
                maxWidth: '90vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: 10,
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'block'
              }}
            />
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div
        style={{
          fontSize: 12,
          color: '#94a3b8',
          textAlign: 'center',
          userSelect: 'none'
        }}
      >
        Mẹo: Dùng phím <kbd style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>+</kbd> / <kbd style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>-</kbd> để thu phóng, <kbd style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Esc</kbd> hoặc nhấp vùng tối để đóng
      </div>
    </div>
  )
}
