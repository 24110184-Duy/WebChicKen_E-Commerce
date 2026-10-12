import React, { useState } from 'react'
import {
  ShieldAlert,
  EyeOff,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'
import { adminProductApi } from '../api/adminProductApi'

export interface AdminProductActionModalProps {
  isOpen: boolean
  productId: string
  productName: string
  productImage?: string
  currentStatus?: string
  onClose: () => void
  onSuccess: (action: 'HIDE' | 'DELETE' | 'UNHIDE', reason: string) => void
}

const PRESET_VIOLATION_REASONS = [
  'Mô tả sản phẩm chứa từ ngữ thổi phồng công dụng y tế / sức khỏe, vi phạm an toàn người dùng.',
  'Nghi vấn thuốc men, thực phẩm chức năng chưa thẩm định giấy phép hoặc kiểm duyệt an toàn.',
  'Sản phẩm không đạt tiêu chuẩn chất lượng / Hàng giả / Kém phẩm chất.',
  'Hình ảnh hoặc giá bán bất thường, có dấu hiệu gian lận hoặc phá giá thị trường.',
  'Sản phẩm thuộc danh mục cấm hoặc vi phạm điều khoản kiểm duyệt của WebChicKen.',
]

export const AdminProductActionModal: React.FC<AdminProductActionModalProps> = ({
  isOpen,
  productId,
  productName,
  productImage,
  currentStatus = 'ACTIVE',
  onClose,
  onSuccess,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const isInactive = currentStatus === 'INACTIVE'

  const handleSelectPreset = (reason: string) => {
    setSelectedPreset(reason)
    setCustomReason(reason)
    setError('')
  }

  const handleUnhideProduct = async () => {
    try {
      setLoading(true)
      setError('')
      const note = customReason.trim() || 'Quản trị viên đã kiểm tra và gỡ ẩn / mở bán lại sản phẩm trên sàn.'
      await adminProductApi.reviewProduct(productId, {
        status: 'ACTIVE',
        moderationNote: note
      })
      onSuccess('UNHIDE', note)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Không thể gỡ ẩn sản phẩm.')
    } finally {
      setLoading(false)
    }
  }

  const handleHideProduct = async () => {
    const finalReason = customReason.trim()
    if (!finalReason) {
      setError('Vui lòng chọn hoặc nhập lý do vi phạm để thông báo cho người bán.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await adminProductApi.reviewProduct(productId, {
        status: 'INACTIVE',
        rejectionReason: finalReason,
        moderationNote: `Quản trị viên trực tiếp gỡ/tạm ẩn khỏi sàn khi tuần tra: ${finalReason}`
      })
      onSuccess('HIDE', finalReason)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Không thể tạm ẩn sản phẩm.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    const finalReason = customReason.trim() || 'Quản trị viên xóa bỏ sản phẩm do vi phạm tiêu chuẩn nghiêm trọng.'
    const confirmed = window.confirm(
      `CẢNH BÁO QUẢN TRỊ VIÊN:\n\nBạn có chắc chắn muốn GỠ VĨNH VIỄN sản phẩm "${productName}" khỏi toàn bộ sàn WebChicKen không?\nHành động này không thể hoàn tác!`
    )
    if (!confirmed) return

    try {
      setLoading(true)
      setError('')
      await adminProductApi.deleteProduct(productId)
      onSuccess('DELETE', finalReason)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Không thể gỡ bỏ sản phẩm khỏi sàn.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          maxWidth: 580,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: isInactive ? '1px solid #bbf7d0' : '1px solid #fee2e2',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: isInactive ? '#f0fdf4' : '#fef2f2',
            borderBottom: isInactive ? '1px solid #dcfce7' : '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: isInactive ? '#16a34a' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              {isInactive ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: isInactive ? '#15803d' : '#991b1b', margin: 0 }}>
                {isInactive
                  ? 'Quản Trị Viên: Bỏ Ẩn / Mở Lại Sản Phẩm'
                  : 'Quản Trị Viên: Can Thiệp Sản Phẩm Trên Sàn'}
              </h3>
              <p style={{ fontSize: 12, color: isInactive ? '#166534' : '#b91c1c', margin: '2px 0 0' }}>
                {isInactive
                  ? 'Sản phẩm này hiện đang bị tạm ẩn. Bạn có thể mở bán lại hoặc gỡ vĩnh viễn khỏi sàn.'
                  : 'Tạm ẩn hoặc gỡ bỏ sản phẩm không đạt chuẩn chất lượng / an toàn người dùng'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Target Product Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 12,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            {productImage ? (
              <img
                src={productImage}
                alt={productName}
                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#64748b',
                }}
              >
                SP
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Sản phẩm đang xem xét:
              </span>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {productName}
              </p>
              <span style={{ fontSize: 11, color: currentStatus === 'ACTIVE' ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                Trạng thái: {currentStatus}
              </span>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>
              Chọn nhanh lý do vi phạm an toàn / chất lượng:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {PRESET_VIOLATION_REASONS.map((reason, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(reason)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: selectedPreset === reason ? '1px solid #dc2626' : '1px solid #e2e8f0',
                    backgroundColor: selectedPreset === reason ? '#fef2f2' : '#ffffff',
                    color: selectedPreset === reason ? '#991b1b' : '#334155',
                    fontWeight: selectedPreset === reason ? 600 : 400,
                  }}
                >
                  • {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Reason Textarea */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase' }}>
              Nội dung thông báo chi tiết gửi Người bán: <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value)
                setError('')
              }}
              placeholder="Nhập chi tiết lỗi vi phạm hoặc giải thích lý do gỡ sản phẩm..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
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
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 16px',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isInactive ? (
                /* Nút Gỡ Ẩn / Mở Bán Lại */
                <button
                  type="button"
                  onClick={handleUnhideProduct}
                  disabled={loading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid #16a34a',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <Eye size={15} />}
                  <span>Bỏ Ẩn & Mở Bán Lại</span>
                </button>
              ) : (
                /* Nút Tạm Ẩn Sản Phẩm */
                <button
                  type="button"
                  onClick={handleHideProduct}
                  disabled={loading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid #d97706',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <EyeOff size={15} />}
                  <span>Tạm Ẩn Sản Phẩm</span>
                </button>
              )}

              {/* Nút Gỡ bỏ vĩnh viễn khỏi sàn */}
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid #b91c1c',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                }}
              >
                <Trash2 size={15} />
                <span>Gỡ Khỏi Sàn</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
