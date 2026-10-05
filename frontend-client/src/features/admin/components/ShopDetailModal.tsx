import React from 'react'
import {
  X,
  Store,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Award,
  Hash,
  Boxes,
} from 'lucide-react'
import type { SellerApplication } from '../types'

export interface ShopDetailModalProps {
  application: SellerApplication | null
  isOpen: boolean
  onClose: () => void
  onApprove: (app: SellerApplication) => void
  onReject: (app: SellerApplication) => void
  isSubmitting?: boolean
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  application,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isSubmitting = false,
}) => {
  if (!isOpen || !application) return null

  const isPending = application.status === 'PENDING'
  const isApproved = application.status === 'APPROVED'
  const isRejected = application.status === 'REJECTED'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
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
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
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
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
              }}
            >
              <Store style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                  {application.shopName}
                </h3>
                {isPending && (
                  <span className="admin-status-badge pending">
                    <span className="admin-pulse-dot" style={{ backgroundColor: '#d97706' }} />
                    Chờ duyệt
                  </span>
                )}
                {isApproved && (
                  <span className="admin-status-badge approved">
                    <CheckCircle2 style={{ width: 13, height: 13 }} />
                    Đã duyệt
                  </span>
                )}
                {isRejected && (
                  <span className="admin-status-badge rejected">
                    <XCircle style={{ width: 13, height: 13 }} />
                    Đã từ chối
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                Mã hồ sơ: <strong>{application.id}</strong> • Mã người dùng: {application.userId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Rejection Alert if applicable */}
          {isRejected && application.rejectionReason && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <AlertTriangle style={{ width: 20, height: 20, color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#991b1b' }}>
                  Lý do hồ sơ bị từ chối
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#b91c1c', lineHeight: 1.5 }}>
                  {application.rejectionReason}
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Thông tin chủ sở hữu & Trại chăn nuôi */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Store style={{ width: 16, height: 16, color: '#3b82f6' }} />
              Thông Tin Chủ Hộ & Cơ Sở Chăn Nuôi
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Đại diện pháp luật:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                  {application.ownerName || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Số điện thoại liên hệ:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone style={{ width: 14, height: 14, color: '#10b981' }} />
                  {application.phone || '098x xxx xxx'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Email giao dịch:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail style={{ width: 14, height: 14, color: '#6366f1' }} />
                  {application.email || 'farm@webchicken.vn'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Địa chỉ trang trại / cơ sở:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin style={{ width: 14, height: 14, color: '#ef4444' }} />
                  {application.farmLocation || 'Đang cập nhật'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Mô hình & Giống gia cầm:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                  {application.farmType || 'Gia cầm sạch nuôi thả'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Quy mô cung ứng:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Boxes style={{ width: 14, height: 14, color: '#f59e0b' }} />
                  {application.dailyCapacity || 'Cung ứng theo ngày'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Tiêu chuẩn An toàn & Thẩm định Pháp lý */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck style={{ width: 16, height: 16, color: '#10b981' }} />
              Thẩm Định Pháp Lý & Tiêu Chuẩn Nông Nghiệp Sạch
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Mã số thuế / ĐKKD:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Hash style={{ width: 14, height: 14, color: '#64748b' }} />
                  {application.taxCode || 'Chưa cung cấp'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Loại giấy chứng nhận:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award style={{ width: 14, height: 14 }} />
                  {application.certificateType || 'VietGAP'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Số hiệu văn bản chứng nhận:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                  {application.certificateNumber || 'VG-POULTRY-2025-01'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Hạn hiệu lực chứng nhận:</span>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar style={{ width: 14, height: 14, color: '#3b82f6' }} />
                  {application.certificateExpiry || 'Không thời hạn'}
                </p>
              </div>
            </div>

            {/* Document preview link */}
            {application.documentUrl && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText style={{ width: 18, height: 18, color: '#3b82f6' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                    Tài liệu hồ sơ đính kèm (Giấy phép & Chứng nhận nông sản)
                  </span>
                </div>
                <a
                  href={application.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#2563eb',
                    textDecoration: 'none',
                    backgroundColor: '#eff6ff',
                    padding: '6px 12px',
                    borderRadius: 6,
                  }}
                >
                  <span>Mở tài liệu gốc</span>
                  <ExternalLink style={{ width: 13, height: 13 }} />
                </a>
              </div>
            )}
          </div>

          {/* Section 3: Timeline audit */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 10,
              fontSize: 12,
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span>
              Ngày nộp đơn: <strong>{new Date(application.submittedAt).toLocaleString('vi-VN')}</strong>
            </span>
            {application.reviewedAt && (
              <span>
                Ngày thẩm định: <strong>{new Date(application.reviewedAt).toLocaleString('vi-VN')}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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
            Đóng cửa sổ
          </button>

          {isPending ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => onReject(application)}
                disabled={isSubmitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '1px solid #fecaca',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <XCircle style={{ width: 16, height: 16 }} />
                <span>Từ chối hồ sơ</span>
              </button>

              <button
                type="button"
                onClick={() => onApprove(application)}
                disabled={isSubmitting}
                style={{
                  padding: '9px 22px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
                }}
              >
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                <span>Phê Duyệt Gian Hàng</span>
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Hồ sơ này đã hoàn tất quá trình thẩm định.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
