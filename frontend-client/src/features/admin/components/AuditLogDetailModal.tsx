import React, { useState } from 'react'
import { X, Copy, Check, ShieldCheck, ScrollText, Calendar, Globe, User, Tag, FileText } from 'lucide-react'
import type { AuditLogItem } from '../types'

export interface AuditLogDetailModalProps {
  log: AuditLogItem | null
  isOpen: boolean
  onClose: () => void
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  log,
  isOpen,
  onClose
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!isOpen || !log) return null

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Chưa ghi nhận'
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BAN_USER':
        return { label: 'Khóa tài khoản', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
      case 'UNBAN_USER':
        return { label: 'Mở khóa tài khoản', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
      case 'APPROVE_PRODUCT':
        return { label: 'Duyệt sản phẩm', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
      case 'REJECT_PRODUCT':
        return { label: 'Từ chối sản phẩm', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }
      case 'APPROVE_SELLER':
        return { label: 'Duyệt người bán', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
      case 'REJECT_SELLER':
        return { label: 'Từ chối người bán', bg: '#fff7ed', color: '#9a3412', border: '#ffedd5' }
      default:
        return { label: action, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' }
    }
  }

  const badge = getActionBadge(log.action)

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
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}
            >
              <ScrollText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Chi Tiết Bản Ghi Kiểm Toán
                </h3>
                <span
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#10b981',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid #059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <ShieldCheck size={12} /> BẤT BIẾN
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
                Mã bản ghi: <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{log.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Đóng hộp thoại"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Action & Target Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 20
            }}
          >
            {/* Hành động */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                <Tag size={14} />
                <span>HÀNH ĐỘNG HỆ THỐNG</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  {badge.label}
                </span>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>
                  ({log.action})
                </span>
              </div>
            </div>

            {/* Loại đối tượng */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                <FileText size={14} />
                <span>TÀI NGUYÊN BỊ TÁC ĐỘNG</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {log.targetType || 'N/A'}
              </div>
              {log.targetId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>
                    ID: {log.targetId}
                  </span>
                  <button
                    onClick={() => handleCopy('targetId', log.targetId!)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: copiedField === 'targetId' ? '#10b981' : '#94a3b8'
                    }}
                    title="Sao chép Target ID"
                  >
                    {copiedField === 'targetId' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Admin Info & IP Section */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              marginBottom: 20
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                  <User size={14} />
                  <span>NGƯỜI THỰC HIỆN (ADMIN)</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  {log.adminName || 'Hệ Thống WebChicKen'}
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  {log.adminEmail || 'admin@webchicken.vn'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                    Admin UUID: {log.adminId}
                  </span>
                  <button
                    onClick={() => handleCopy('adminId', log.adminId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: copiedField === 'adminId' ? '#10b981' : '#94a3b8'
                    }}
                    title="Sao chép Admin ID"
                  >
                    {copiedField === 'adminId' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                  <Globe size={14} />
                  <span>ĐỊA CHỈ IP GHI NHẬN</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {log.ipAddress || '127.0.0.1 (Localhost)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp Section */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13 }}>
              <Calendar size={16} color="#64748b" />
              <span>Thời điểm ghi nhận (Timestamp):</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {formatDateTime(log.createdAt)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                {log.createdAt}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
              Nội dung chi tiết thao tác:
            </label>
            <div
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: '14px 16px',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {log.detail || 'Không có mô tả chi tiết đi kèm.'}
            </div>
          </div>

          {/* Security & Tamper Proof Pill */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}
          >
            <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
              <strong>Tính toàn vẹn kiểm toán (WORM Principle):</strong> Bản ghi này được hệ thống WebChicKen ghi nhận tự động vào cơ sở dữ liệu và được khóa bảo mật không cho phép cập nhật hoặc xóa dưới mọi hình thức, nhằm phục vụ công tác thanh tra và đối soát rủi ro.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
