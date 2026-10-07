import React, { useState, useEffect } from 'react'
import {
  X,
  MessageSquare,
  Building,
  Mail,
  Calendar,
  AlertCircle,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import type { FeedbackItem, FeedbackStatus } from '../../shop/types/feedbackTypes'

interface RespondFeedbackModalProps {
  isOpen: boolean
  feedback: FeedbackItem | null
  onClose: () => void
  onSubmit: (id: string, status: FeedbackStatus, adminResponse: string) => Promise<void>
}

export const RespondFeedbackModal: React.FC<RespondFeedbackModalProps> = ({
  isOpen,
  feedback,
  onClose,
  onSubmit
}) => {
  const [status, setStatus] = useState<FeedbackStatus>('RESOLVED')
  const [responseContent, setResponseContent] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status === 'PENDING' ? 'RESOLVED' : feedback.status)
      setResponseContent(feedback.adminResponse || '')
      setError(null)
    }
  }, [feedback])

  if (!isOpen || !feedback) return null

  const handleApplyTemplate = (text: string, newStatus: FeedbackStatus) => {
    setResponseContent(text)
    setStatus(newStatus)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseContent.trim()) {
      setError('Vui lòng nhập nội dung phản hồi cho nhà bán.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onSubmit(feedback.id, status, responseContent.trim())
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu phản hồi.')
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'COMPLAINT':
        return { label: 'Khiếu nại', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
      case 'INQUIRY':
        return { label: 'Thắc mắc vận hành', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' }
      case 'SUGGESTION':
        return { label: 'Đề xuất cải tiến', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
      case 'SYSTEM_BUG':
        return { label: 'Báo lỗi hệ thống', bg: '#fef3c7', color: '#92400e', border: '#fde68a' }
      default:
        return { label: 'Ý kiến khác', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
    }
  }

  const badge = getTypeBadge(feedback.type)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dbeafe'
              }}
            >
              <MessageSquare size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Xử Lý Phản Hồi Từ Nhà Bán
                </h3>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}
                >
                  {badge.label}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                Mã phiếu: <strong>{feedback.id}</strong> • Gửi ngày {new Date(feedback.createdAt).toLocaleString('vi-VN')}
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
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            title="Đóng modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Shop / User Info Bar */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={16} color="#2563eb" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                {feedback.shopName || 'Hộ kinh doanh / Nhà bán chưa đặt tên'}
              </span>
            </div>
            {feedback.userEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                <Mail size={15} />
                <span>{feedback.userEmail}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748b' }}>
              <Calendar size={14} />
              <span>Cập nhật: {feedback.updatedAt ? new Date(feedback.updatedAt).toLocaleTimeString('vi-VN') : '—'}</span>
            </div>
          </div>

          {/* Ticket Subject & Detailed Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chủ Đề & Nội Dung Khiếu Nại
            </label>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0f172a',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8
              }}
            >
              {feedback.subject}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: '#334155',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                whiteSpace: 'pre-wrap'
              }}
            >
              {feedback.content}
            </div>
          </div>

          {/* Screenshot / Proof Image if available */}
          {feedback.imageUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tài Liệu / Ảnh Minh Chứng Đính Kèm
              </label>
              <div
                style={{
                  padding: 10,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                <img
                  src={feedback.imageUrl}
                  alt="Minh chứng từ người bán"
                  style={{
                    width: 100,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Ảnh chụp tài liệu kiểm chứng</span>
                  <a
                    href={feedback.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 12.5,
                      color: '#2563eb',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    <span>Mở xem ảnh gốc độ phân giải cao</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Quick Reply Suggestions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={15} color="#8b5cf6" />
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mẫu Phản Hồi Nhanh Dành Cho Quản Trị Viên
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Đội ngũ Kiểm duyệt Sàn đã rà soát và xử lý thành công yêu cầu của quý nông trại. Mọi quyền lợi và dữ liệu đã được cập nhật chính xác trên hệ thống WebChicKen.',
                    'RESOLVED'
                  )
                }
                style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid #a7f3d0',
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                ✓ Đã xử lý & Duyệt yêu cầu
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Ban Quản trị đã chuyển tiếp nội dung khiếu nại tới Bộ phận Kỹ thuật & Vận hành sàn để đối soát sâu. Chúng tôi sẽ cập nhật kết quả trong vòng 24 giờ tới.',
                    'IN_REVIEW'
                  )
                }
                style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                ⏱ Chuyển bộ phận chuyên trách thẩm tra
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Rất tiếc yêu cầu này không đáp ứng đủ quy chuẩn vận hành của WebChicKen. Xin vui lòng cung cấp thêm hồ sơ pháp lý / giấy kiểm dịch hợp lệ để được tái thẩm định.',
                    'REJECTED'
                  )
                }
                style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                ✕ Từ chối do thiếu hồ sơ hợp lệ
              </button>
            </div>
          </div>

          {/* Form Controls */}
          <form id="respond-feedback-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#b91c1c',
                  fontSize: 13
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Status Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                Trạng thái sau phản hồi:
              </label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${status === 'RESOLVED' ? '#10b981' : '#e2e8f0'}`,
                    backgroundColor: status === 'RESOLVED' ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: status === 'RESOLVED' ? '#047857' : '#475569'
                  }}
                >
                  <input
                    type="radio"
                    name="status"
                    value="RESOLVED"
                    checked={status === 'RESOLVED'}
                    onChange={() => setStatus('RESOLVED')}
                    style={{ accentColor: '#10b981' }}
                  />
                  <span>Đã giải quyết (Resolved)</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${status === 'IN_REVIEW' ? '#3b82f6' : '#e2e8f0'}`,
                    backgroundColor: status === 'IN_REVIEW' ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: status === 'IN_REVIEW' ? '#1d4ed8' : '#475569'
                  }}
                >
                  <input
                    type="radio"
                    name="status"
                    value="IN_REVIEW"
                    checked={status === 'IN_REVIEW'}
                    onChange={() => setStatus('IN_REVIEW')}
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <span>Đang xem xét (In Review)</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${status === 'REJECTED' ? '#ef4444' : '#e2e8f0'}`,
                    backgroundColor: status === 'REJECTED' ? '#fef2f2' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: status === 'REJECTED' ? '#b91c1c' : '#475569'
                  }}
                >
                  <input
                    type="radio"
                    name="status"
                    value="REJECTED"
                    checked={status === 'REJECTED'}
                    onChange={() => setStatus('REJECTED')}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <span>Từ chối giải quyết (Rejected)</span>
                </label>
              </div>
            </div>

            {/* Response TextArea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                Nội dung trả lời trực tiếp cho Nhà Bán: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Nhập thông tin hướng dẫn, giải thích quyết định hoặc cam kết tiến độ xử lý..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  lineHeight: 1.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748b' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Thao tác sẽ tự động ghi sổ nhật ký kiểm toán hệ thống</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              form="respond-feedback-form"
              disabled={submitting}
              style={{
                padding: '9px 22px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
            >
              {submitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Lưu & Gửi Phản Hồi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
