import React, { useState } from 'react'
import { AlertTriangle, X, ShieldAlert } from 'lucide-react'

export interface ProductRejectModalProps {
  isOpen: boolean
  productName: string
  onClose: () => void
  onConfirm: (reason: string) => void
  isSubmitting?: boolean
}

const PRESET_PRODUCT_REASONS = [
  'Hình ảnh sản phẩm mờ, không thực tế hoặc có dấu hiệu lấy cắp từ nguồn khác.',
  'Thiếu chứng nhận kiểm dịch thú y và nguồn gốc giống gia cầm an toàn sinh học.',
  'Mô tả sản phẩm chứa từ ngữ thổi phồng công dụng y học, sai lệch cam kết chất lượng.',
  'Giá bán hoặc phân loại biến thể (SKU) bất thường so với quy chuẩn thị trường.',
  'Sản phẩm không thuộc nhóm gia cầm, trứng sạch hoặc vi phạm chính sách kiểm duyệt.',
]

export const ProductRejectModal: React.FC<ProductRejectModalProps> = ({
  isOpen,
  productName,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const handleSelectPreset = (reason: string) => {
    setSelectedPreset(reason)
    setCustomReason(reason)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalReason = customReason.trim()
    if (!finalReason) {
      setError('Vui lòng chọn hoặc nhập lý do từ chối để Người bán kịp thời chỉnh sửa.')
      return
    }
    onConfirm(finalReason)
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
          border: '1px solid #fee2e2',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#991b1b' }}>
                Từ Chối Phê Duyệt Sản Phẩm
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>
                Sản phẩm sẽ bị chuyển về trạng thái <b>INACTIVE</b> và thông báo cho gian hàng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>TÊN SẢN PHẨM:</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              {productName}
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 8,
              }}
            >
              Chọn nhanh lý do vi phạm phổ biến:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRESET_PRODUCT_REASONS.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(reason)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: selectedPreset === reason ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    backgroundColor: selectedPreset === reason ? '#fef2f2' : '#ffffff',
                    color: selectedPreset === reason ? '#b91c1c' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  • {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Custom text area */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Nội dung thông báo chi tiết gửi Người bán: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value)
                setError('')
              }}
              placeholder="Nhập ghi chú chi tiết hoặc điểm cần khắc phục của sản phẩm..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                fontSize: 13,
                borderRadius: 8,
                border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#dc2626',
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
