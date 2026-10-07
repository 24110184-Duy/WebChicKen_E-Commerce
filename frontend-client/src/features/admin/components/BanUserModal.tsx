import React, { useState } from 'react'
import { ShieldAlert, X, AlertTriangle, Lock } from 'lucide-react'
import type { AdminUserItem, BanUserRequest } from '../types'

export interface BanUserModalProps {
  user: AdminUserItem | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (userId: string, request: BanUserRequest) => Promise<void>
}

const PRESET_VIOLATION_REASONS = [
  'Gian lận đơn hàng / Đặt đơn ảo nhằm trục lợi khuyến mãi (Fake Orders / Fraud)',
  'Spam đánh giá, bình luận khiêu khích hoặc phá hoại uy tín sàn (System Abuse)',
  'Kinh doanh gà thả vườn / gia cầm không có kiểm dịch thú y hoặc vi phạm VietGAP',
  'Hành vi lừa đảo chiếm đoạt tiền thanh toán hoặc bom hàng chuỗi lạnh bảo quản tươi',
  'Ngôn từ xúc phạm, đe dọa khách hàng hoặc đối tác vận chuyển',
  'Lý do khác (Nhập chi tiết bên dưới)'
]

const DURATION_OPTIONS = [
  { label: '7 Ngày (Tạm khóa cảnh cáo)', days: 7 },
  { label: '30 Ngày (Đình chỉ vi phạm mức 2)', days: 30 },
  { label: '90 Ngày (Khóa nghiêm trọng 3 tháng)', days: 90 },
  { label: 'Vĩnh viễn (Thu hồi tài khoản vĩnh viễn)', days: null }
]

export const BanUserModal: React.FC<BanUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_VIOLATION_REASONS[0])
  const [customReason, setCustomReason] = useState<string>('')
  const [selectedDuration, setSelectedDuration] = useState<number | null>(30)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  if (!isOpen || !user) return null

  const isCustom = selectedPreset === PRESET_VIOLATION_REASONS[PRESET_VIOLATION_REASONS.length - 1]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const finalReason = isCustom
      ? customReason.trim()
      : customReason.trim()
      ? `${selectedPreset} — ${customReason.trim()}`
      : selectedPreset

    if (isCustom && !customReason.trim()) {
      setErrorMsg('Vui lòng mô tả chi tiết lý do khóa tài khoản.')
      return
    }

    try {
      setIsSubmitting(true)
      await onConfirm(user.userId, {
        reason: finalReason,
        durationDays: selectedDuration
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi thực hiện khóa tài khoản.')
    } finally {
      setIsSubmitting(false)
    }
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
        padding: 16
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          maxWidth: 580,
          width: '100%',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#fff1f2',
            borderBottom: '1px solid #ffe4e6',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#9f1239' }}>
                Khóa / Cấm Tài Khoản Người Dùng
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#be123c', fontWeight: 500 }}>
                Chế tài kỷ luật & bảo vệ an ninh sàn WebChicKen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: '#94a3b8',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Target User Info Card */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#e0f2fe',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#0369a1',
                fontSize: 16,
                flexShrink: 0
              }}
            >
              {user.logoUrl ? (
                <img src={user.logoUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.fullName.charAt(0)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{user.fullName}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: '#e2e8f0',
                    color: '#475569'
                  }}
                >
                  {user.roles.join(' • ')}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748b' }}>
                {user.email} • {user.phone || 'Chưa liên kết SĐT'}
              </p>
              {user.storeName && (
                <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                  🏪 Gian hàng: {user.storeName}
                </p>
              )}
            </div>
          </div>

          {/* Security Alert Banner */}
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}
          >
            <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              <strong style={{ color: '#78350f' }}>Lưu ý an ninh hệ thống:</strong> Khi kích hoạt khóa tài khoản, toàn bộ các phiên làm việc (Active Sessions) của người dùng này trên tất cả các trình duyệt và thiết bị sẽ bị <u>thu hồi ngay lập tức</u> (TASK-66).
            </div>
          </div>

          {/* Chọn lý do vi phạm */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Lý do áp dụng chế tài vi phạm <span style={{ color: '#e11d48' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRESET_VIOLATION_REASONS.map((reason, idx) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: selectedPreset === reason ? '1px solid #f43f5e' : '1px solid #e2e8f0',
                    backgroundColor: selectedPreset === reason ? '#fff1f2' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: selectedPreset === reason ? '#9f1239' : '#334155',
                    fontWeight: selectedPreset === reason ? 600 : 400
                  }}
                >
                  <input
                    type="radio"
                    name="ban_reason"
                    checked={selectedPreset === reason}
                    onChange={() => setSelectedPreset(reason)}
                    style={{ accentColor: '#e11d48' }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Chọn thời hạn */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Thời hạn áp dụng chế tài
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {DURATION_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDuration(opt.days)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: selectedDuration === opt.days ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: selectedDuration === opt.days ? '#0f172a' : '#ffffff',
                    color: selectedDuration === opt.days ? '#ffffff' : '#334155'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú chi tiết */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Ghi chú bổ sung / Dẫn chứng kiểm toán
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập mã đơn hàng gian lận, báo cáo vi phạm kiểm dịch hoặc ghi chú chi tiết..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, fontSize: 12, color: '#e11d48' }}>
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                borderRadius: 8,
                cursor: 'pointer',
                border: 'none'
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#e11d48',
                borderRadius: 8,
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.3)'
              }}
            >
              <Lock size={15} />
              <span>{isSubmitting ? 'Đang khóa...' : 'Xác nhận Khóa tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
