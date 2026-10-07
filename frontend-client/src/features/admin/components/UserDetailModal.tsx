import React, { useState, useEffect } from 'react'
import { X, Lock, Unlock, Copy, Check, AlertCircle } from 'lucide-react'
import type { AdminUserItem, AccountBanInfo } from '../types'
import { fetchUserBanHistory } from '../api/adminUserApi'

export interface UserDetailModalProps {
  user: AdminUserItem | null
  isOpen: boolean
  onClose: () => void
  onOpenBanModal: (user: AdminUserItem) => void
  onOpenUnbanModal: (user: AdminUserItem) => void
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenBanModal,
  onOpenUnbanModal
}) => {
  const [banHistory, setBanHistory] = useState<AccountBanInfo[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)
  const [copiedId, setCopiedId] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen && user) {
      setLoadingHistory(true)
      fetchUserBanHistory(user.userId)
        .then((bans) => setBanHistory(bans))
        .catch(() => setBanHistory([]))
        .finally(() => setLoadingHistory(false))
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.userId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const isBanned = user.status === 'BANNED'
  const isLocked = user.status === 'LOCKED'

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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: 680,
          width: '100%',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0f172a',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#10b981'
              }}
            >
              {user.logoUrl ? (
                <img src={user.logoUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.fullName.charAt(0)
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{user.fullName}</h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    textTransform: 'uppercase',
                    backgroundColor: user.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: user.status === 'ACTIVE' ? '#34d399' : '#f87171',
                    border: user.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {user.status === 'ACTIVE' ? 'Đang hoạt động' : isBanned ? 'Đang bị cấm' : 'Tạm khóa'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    padding: 0
                  }}
                  title="Sao chép User ID"
                >
                  <span>{user.userId}</span>
                  {copiedId ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedId && <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'inherit' }}>Đã chép!</span>}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: '#94a3b8',
              padding: 6,
              borderRadius: 6
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          {/* Identity & Roles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 4 }}>
                Email & Số điện thoại
              </span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user.email}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#475569' }}>{user.phone || 'Chưa liên kết SĐT'}</p>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 4 }}>
                Vai trò hệ thống
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {user.roles.map((r) => (
                  <span
                    key={r}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 6,
                      backgroundColor: r === 'SUPER_ADMIN' ? '#f5f3ff' : r === 'SELLER' ? '#fef3c7' : '#eff6ff',
                      color: r === 'SUPER_ADMIN' ? '#6d28d9' : r === 'SELLER' ? '#b45309' : '#1d4ed8',
                      border: r === 'SUPER_ADMIN' ? '1px solid #ddd6fe' : r === 'SELLER' ? '1px solid #fde68a' : '1px solid #bfdbfe'
                    }}
                  >
                    {r === 'SUPER_ADMIN' ? '🛡️ Quản trị viên cấp cao' : r === 'SELLER' ? '🏪 Nhà bán (Seller)' : '👤 Khách hàng (Buyer)'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Customer & Seller Perks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 4 }}>
                Hạng thành viên & Loyalty
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 6, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                  {user.tier || 'STANDARD'}
                </span>
                <span style={{ fontSize: 12, color: '#475569' }}>
                  Điểm: <strong style={{ color: '#0f172a' }}>{user.loyaltyPoint ?? 0} pts</strong>
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 4 }}>
                Gian hàng Người bán (Shop)
              </span>
              {user.storeName ? (
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#065f46' }}>{user.storeName}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{user.storeId}</p>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Chưa đăng ký gian hàng</p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#475569'
            }}
          >
            <div>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Ngày tham gia</span>
              <strong style={{ color: '#0f172a' }}>{new Date(user.createdAt).toLocaleString('vi-VN')}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Cập nhật lần cuối</span>
              <strong style={{ color: '#0f172a' }}>{user.updatedAt ? new Date(user.updatedAt).toLocaleString('vi-VN') : '—'}</strong>
            </div>
          </div>

          {/* Active Ban Alert */}
          {user.activeBan && (
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: 12,
                padding: 16
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9f1239', marginBottom: 6 }}>
                <AlertCircle size={18} />
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>Lệnh cấm đang có hiệu lực</h4>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#881337', fontWeight: 600, backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: 10, borderRadius: 8, border: '1px solid #ffe4e6' }}>
                {user.activeBan.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#be123c', marginTop: 8 }}>
                <span>Bắt đầu: {new Date(user.activeBan.bannedAt).toLocaleString('vi-VN')}</span>
                <span>Thời hạn: {user.activeBan.bannedUntil ? new Date(user.activeBan.bannedUntil).toLocaleString('vi-VN') : 'Vĩnh viễn'}</span>
              </div>
            </div>
          )}

          {/* Ban History Audit */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#334155' }}>
                Lịch sử chế tài & Kiểm toán bảo mật
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{banHistory.length} bản ghi</span>
            </div>

            {loadingHistory ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Đang tải lịch sử kiểm toán...</div>
            ) : banHistory.length === 0 ? (
              <div style={{ padding: 16, borderRadius: 10, border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                Tài khoản này chưa từng bị ghi nhận vi phạm chính sách sàn WebChicKen.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {banHistory.map((b, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{b.description}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 8,
                          backgroundColor: b.unbannedAt ? '#d1fae5' : '#fee2e2',
                          color: b.unbannedAt ? '#065f46' : '#991b1b'
                        }}
                      >
                        {b.unbannedAt ? 'Đã mở khóa' : 'Đang hiệu lực'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                      <span>Bắt đầu: {new Date(b.bannedAt).toLocaleString('vi-VN')}</span>
                      {b.unbannedAt && <span>Mở khóa: {new Date(b.unbannedAt).toLocaleString('vi-VN')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#e2e8f0',
              borderRadius: 8,
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Đóng
          </button>

          <div>
            {isBanned || isLocked ? (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenUnbanModal(user)
                }}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#059669',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Unlock size={15} />
                <span>Mở khóa tài khoản</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenBanModal(user)
                }}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#e11d48',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Lock size={15} />
                <span>Khóa tài khoản này</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
