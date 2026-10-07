import React, { useState } from 'react'
import { Unlock, X } from 'lucide-react'
import type { AdminUserItem, UnbanUserRequest } from '../types'

export interface UnbanUserModalProps {
  user: AdminUserItem | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (userId: string, request: UnbanUserRequest) => Promise<void>
}

export const UnbanUserModal: React.FC<UnbanUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    try {
      setIsSubmitting(true)
      await onConfirm(user.userId, {
        reason: reason.trim() || 'Tài khoản đã hoàn tất giải trình và được Ban Quản Trị chấp thuận mở khóa.'
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi thực hiện mở khóa tài khoản.')
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
          maxWidth: 500,
          width: '100%',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#ecfdf5',
            borderBottom: '1px solid #d1fae5',
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
                backgroundColor: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Unlock size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#065f46' }}>
                Mở Khóa Tài Khoản Người Dùng
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#047857', fontWeight: 500 }}>
                Khôi phục toàn bộ quyền giao dịch trên sàn
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Target User */}
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
                backgroundColor: '#fee2e2',
                border: '1px solid #fecdd3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#991b1b',
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
                    backgroundColor: '#fee2e2',
                    color: '#991b1b'
                  }}
                >
                  {user.status === 'BANNED' ? 'Đang bị cấm' : 'Đang tạm khóa'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748b' }}>
                {user.email} • {user.phone || 'Chưa liên kết SĐT'}
              </p>
            </div>
          </div>

          {/* Current Active Ban Details */}
          {user.activeBan && (
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #ffe4e6',
                borderRadius: 10,
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9f1239', marginBottom: 4 }}>
                Chi tiết lý do cấm hiện tại:
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#881337', fontWeight: 500 }}>
                {user.activeBan.description}
              </p>
              <p style={{ margin: '6px 0 0 0', fontSize: 11, color: '#e11d48' }}>
                Áp dụng: {new Date(user.activeBan.bannedAt).toLocaleString('vi-VN')}
                {user.activeBan.bannedUntil ? ` • Đến: ${new Date(user.activeBan.bannedUntil).toLocaleString('vi-VN')}` : ' • Vĩnh viễn'}
              </p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Căn cứ mở khóa / Ghi chú kiểm toán
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập ghi chú (Ví dụ: Đã nộp bản giải trình kiểm dịch / cam kết khắc phục)..."
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
                backgroundColor: '#059669',
                borderRadius: 8,
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Unlock size={15} />
              <span>{isSubmitting ? 'Đang mở khóa...' : 'Xác nhận Mở khóa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
