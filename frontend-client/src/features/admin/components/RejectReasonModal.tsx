import React, { useState } from 'react'
import { AlertCircle, X, ShieldAlert } from 'lucide-react'

export interface RejectReasonModalProps {
  isOpen: boolean
  shopName: string
  onClose: () => void
  onConfirm: (reason: string) => void
  isSubmitting?: boolean
}

const PRESET_REASONS = [
  'Giấy chứng nhận VietGAP / An toàn thực phẩm đã hết hiệu lực.',
  'Thiếu giấy chứng nhận kiểm dịch thú y vùng nuôi gia cầm sạch.',
  'Mã số thuế doanh nghiệp / hộ kinh doanh không trùng khớp với chủ sở hữu.',
  'Địa chỉ trại chăn nuôi chưa xác thực được trên bản đồ quy hoạch thú y.',
  'Tên gian hàng không phù hợp hoặc trùng lặp với thương hiệu đã đăng ký bảo hộ.',
]

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  shopName,
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
      setError('Vui lòng cung cấp lý do cụ thể để người bán có thể bổ sung hồ sơ.')
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: 580,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'adminScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #fee2e2',
            backgroundColor: '#fef2f2',
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
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fecaca',
              }}
            >
              <ShieldAlert style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#991b1b' }}>
                Từ Chối Hồ Sơ Gian Hàng
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>
                Gian hàng: <strong>{shopName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              Chọn nhanh lý do từ chối mẫu:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRESET_REASONS.map((preset, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    border: selectedPreset === preset ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                    backgroundColor: selectedPreset === preset ? '#fef2f2' : '#f8fafc',
                    color: selectedPreset === preset ? '#991b1b' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  • {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Nội dung thông báo gửi cho người bán <span style={{ color: '#ef4444' }}>*</span>:
            </label>
            <textarea
              rows={4}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value)
                setError('')
              }}
              placeholder="Nhập chi tiết lý do từ chối và hướng dẫn người bán bổ sung giấy tờ cần thiết..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: error ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#dc2626', fontSize: 12 }}>
                <AlertCircle style={{ width: 14, height: 14 }} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#fffbeb',
              borderRadius: 8,
              border: '1px solid #fef3c7',
              fontSize: 12,
              color: '#92400e',
            }}
          >
            Lưu ý: Sau khi từ chối, người bán sẽ nhận được thông báo kèm lý do cụ thể và có thể nộp lại hồ sơ bổ sung.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
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
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
              }}
            >
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận Từ Chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
