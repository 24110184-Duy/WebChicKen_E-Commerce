import React, { useState } from 'react'
import { Eye, X, CheckCircle2, AlertCircle, RefreshCw, Store, Tag } from 'lucide-react'
import type { AdminProductItem } from '../types'

export interface ProductUnhideModalProps {
  isOpen: boolean
  product: AdminProductItem | null
  onClose: () => void
  onConfirm: (note: string) => void
  isSubmitting?: boolean
}

const PRESET_UNHIDE_REASONS = [
  'Người bán đã cập nhật lại thông tin, hình ảnh đạt chuẩn kiểm duyệt của sàn.',
  'Đã xác minh đầy đủ giấy chứng nhận kiểm dịch và nguồn gốc an toàn thực phẩm.',
  'Sản phẩm đã được Quản trị viên thẩm định lại đạt tiêu chuẩn mở bán công khai.',
  'Đã khắc phục lỗi phân loại biến thể (SKU) và giá bán phù hợp quy chuẩn thị trường.',
  'Mô tả sản phẩm đã được biên tập lại, không còn từ ngữ sai lệch hoặc vi phạm.',
]

export const ProductUnhideModal: React.FC<ProductUnhideModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [customNote, setCustomNote] = useState<string>('')
  const [error, setError] = useState<string>('')

  if (!isOpen || !product) return null

  const handleSelectPreset = (note: string) => {
    setSelectedPreset(note)
    setCustomNote(note)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalNote = customNote.trim() || selectedPreset.trim() || 'Quản trị viên đã kiểm tra và gỡ ẩn / mở bán lại sản phẩm trên sàn.'
    onConfirm(finalNote)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          maxWidth: 580,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #bbf7d0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#f0fdf4',
            borderBottom: '1px solid #dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
              }}
            >
              <Eye size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#15803d' }}>
                Bỏ Ẩn & Kích Hoạt Mở Bán Lại
              </h3>
              <span style={{ fontSize: 12, color: '#166534' }}>
                Sản phẩm sẽ xuất hiện công khai trở lại trên sàn thương mại điện tử
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#15803d',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Thông tin sản phẩm */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={
                  product.thumbnailUrl ||
                  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=200&q=80'
                }
                alt={product.name}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={product.name}
                >
                  {product.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Store size={12} color="#d97706" /> {product.storeName || 'Gian hàng đối tác'}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Tag size={12} /> {product.categoryName || 'Danh mục'}
                  </span>
                </div>
              </div>
            </div>

            {product.rejectionReason && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  fontSize: 12,
                  color: '#991b1b',
                }}
              >
                <b>Lý do đã ẩn trước đó:</b> {product.rejectionReason}
              </div>
            )}
          </div>

          {/* Chọn nhanh lý do gỡ ẩn */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Chọn nhanh lý do chấp thuận gỡ ẩn:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {PRESET_UNHIDE_REASONS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: selectedPreset === preset ? '1px solid #16a34a' : '1px solid #e2e8f0',
                    backgroundColor: selectedPreset === preset ? '#f0fdf4' : '#ffffff',
                    color: selectedPreset === preset ? '#15803d' : '#334155',
                    fontWeight: selectedPreset === preset ? 600 : 400,
                  }}
                >
                  ✓ {preset}
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú biên bản kiểm duyệt */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Ghi chú thẩm định mở bán lại:
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => {
                setCustomNote(e.target.value)
                setError('')
              }}
              placeholder="Nhập ghi chú hoặc biên bản kiểm tra chứng từ an toàn..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.35)',
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Xác Nhận Bỏ Ẩn & Mở Bán</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
