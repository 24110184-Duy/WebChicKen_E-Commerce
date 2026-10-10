import React, { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bug,
  Lightbulb,
  FileText,
  Image,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import type {
  FeedbackItem,
  FeedbackType,
  CreateFeedbackPayload
} from '../../features/shop/types/feedbackTypes'
import {
  submitSellerFeedback,
  fetchSellerFeedbacks
} from '../../features/shop/api/feedbackApi'

export const SellerFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [type, setType] = useState<FeedbackType>('INQUIRY')
  const [subject, setSubject] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  // Selected feedback for viewing response
  const [viewingFeedback, setViewingFeedback] = useState<FeedbackItem | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadSellerFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchSellerFeedbacks(1, 50)
      setFeedbacks(data.items)
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sử phản hồi seller:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSellerFeedbacks()
  }, [loadSellerFeedbacks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      setFormError('Vui lòng nhập tiêu đề phản hồi hoặc khiếu nại.')
      return
    }
    if (!content.trim()) {
      setFormError('Vui lòng nhập nội dung chi tiết để BQT có thể hỗ trợ tốt nhất.')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)

      const payload: CreateFeedbackPayload = {
        type,
        subject: subject.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined
      }

      const created = await submitSellerFeedback(payload)
      showToast('Đã gửi phiếu hỗ trợ đến Ban Quản trị sàn thành công!', 'success')

      // Reset form
      setSubject('')
      setContent('')
      setImageUrl('')
      setType('INQUIRY')

      // Cập nhật danh sách và chuyển sang tab lịch sử
      setFeedbacks((prev) => [created, ...prev])
      setActiveTab('history')
    } catch (err: any) {
      setFormError(err?.message || 'Có lỗi xảy ra khi gửi phản hồi.')
      showToast('Không thể gửi phiếu hỗ trợ. Vui lòng thử lại.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = feedbacks.filter((f) => f.status === 'PENDING').length
  const inReviewCount = feedbacks.filter((f) => f.status === 'IN_REVIEW').length
  const resolvedCount = feedbacks.filter((f) => f.status === 'RESOLVED').length

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 9999,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a'
            }}
          >
            <Clock size={12} />
            <span>Chờ BQT tiếp nhận</span>
          </span>
        )
      case 'IN_REVIEW':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 9999,
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe'
            }}
          >
            <RefreshCw size={12} className="spin-slow" />
            <span>Đang giải quyết</span>
          </span>
        )
      case 'RESOLVED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 9999,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0'
            }}
          >
            <CheckCircle2 size={12} />
            <span>Đã giải quyết</span>
          </span>
        )
      case 'REJECTED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 9999,
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca'
            }}
          >
            <AlertCircle size={12} />
            <span>Từ chối</span>
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'COMPLAINT':
        return { label: 'Khiếu nại', icon: <ShieldAlert size={14} color="#dc2626" /> }
      case 'INQUIRY':
        return { label: 'Thắc mắc vận hành', icon: <HelpCircle size={14} color="#2563eb" /> }
      case 'SUGGESTION':
        return { label: 'Đề xuất cải tiến', icon: <Lightbulb size={14} color="#059669" /> }
      case 'SYSTEM_BUG':
        return { label: 'Báo lỗi hệ thống', icon: <Bug size={14} color="#d97706" /> }
      default:
        return { label: 'Ý kiến khác', icon: <FileText size={14} color="#64748b" /> }
    }
  }

  return (
    <SellerLayout>
      <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: 10,
              backgroundColor: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
              color: '#ffffff',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 500
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MessageSquare size={20} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Hỗ Trợ & Khiếu Nại Ban Quản Trị
              </h1>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 6, marginBottom: 0 }}>
              Kênh kết nối chính thức giữa Nhà Bán Hàng và Ban Quản Trị Sàn WebChicKen Marketplace
            </p>
          </div>

          <button
            type="button"
            onClick={loadSellerFeedbacks}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              color: '#475569',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {/* Bento Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 28
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Tổng phản hồi đã gửi</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{feedbacks.length}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
            >
              <FileText size={20} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#92400e' }}>Chờ BQT tiếp nhận</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309', marginTop: 4 }}>{pendingCount}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706'
              }}
            >
              <Clock size={20} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e40af' }}>Đang giải quyết</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{inReviewCount}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
            >
              <RefreshCw size={20} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#065f46' }}>Đã giải quyết xong</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>{resolvedCount}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* Main Content: Tabs */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              padding: '0 16px'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              style={{
                padding: '14px 20px',
                border: 'none',
                borderBottom: `2.5px solid ${activeTab === 'create' ? '#2563eb' : 'transparent'}`,
                backgroundColor: 'transparent',
                color: activeTab === 'create' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'create' ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Send size={16} />
              <span>Gửi Phiếu Khiếu Nại / Thắc Mắc Mới</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                padding: '14px 20px',
                border: 'none',
                borderBottom: `2.5px solid ${activeTab === 'history' ? '#2563eb' : 'transparent'}`,
                backgroundColor: 'transparent',
                color: activeTab === 'history' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'history' ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FileText size={16} />
              <span>Lịch Sử Phản Hồi ({feedbacks.length})</span>
            </button>
          </div>

          {/* Tab 1: Submission Form */}
          {activeTab === 'create' && (
            <div style={{ padding: '28px 32px' }}>
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: '#eff6ff',
                  borderRadius: 10,
                  border: '1px solid #bfdbfe',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <Sparkles size={20} color="#2563eb" />
                <span style={{ fontSize: 13.5, color: '#1e40af' }}>
                  Ban Quản trị WebChicKen cam kết tiếp nhận và phản hồi mọi yêu cầu của nhà bán hàng trong vòng <strong>24 - 48 giờ làm việc</strong>.
                </span>
              </div>

              {formError && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#b91c1c',
                    fontSize: 13.5
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Type Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                    Phân loại yêu cầu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {[
                      { val: 'INQUIRY', label: 'Thắc mắc vận hành', icon: <HelpCircle size={16} color="#2563eb" /> },
                      { val: 'COMPLAINT', label: 'Khiếu nại kiểm duyệt/đơn', icon: <ShieldAlert size={16} color="#dc2626" /> },
                      { val: 'SUGGESTION', label: 'Đề xuất tính năng mới', icon: <Lightbulb size={16} color="#059669" /> },
                      { val: 'SYSTEM_BUG', label: 'Báo lỗi hệ thống', icon: <Bug size={16} color="#d97706" /> },
                      { val: 'OTHER', label: 'Ý kiến khác', icon: <FileText size={16} color="#64748b" /> }
                    ].map((item) => (
                      <div
                        key={item.val}
                        onClick={() => setType(item.val as FeedbackType)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${type === item.val ? '#2563eb' : '#e2e8f0'}`,
                          backgroundColor: type === item.val ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {item.icon}
                        <span style={{ fontSize: 13, fontWeight: type === item.val ? 700 : 500, color: type === item.val ? '#1d4ed8' : '#334155' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                    Tiêu đề phản hồi / khiếu nại <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ví dụ: Khiếu nại thời gian kiểm duyệt sản phẩm Gà Đồi..."
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Content */}
                <div>
                  <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                    Nội dung chi tiết <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả cụ thể vấn đề quý nhà bán gặp phải, mã đơn hàng hoặc mã sản phẩm liên quan để BQT xử lý nhanh chóng..."
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

                {/* Image URL */}
                <div>
                  <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                    Đường dẫn ảnh minh chứng (URL hình ảnh / giấy tờ kiểm dịch nếu có)
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... hoặc đường dẫn ảnh tài liệu"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 38px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 14,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <Image size={17} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 13 }} />
                    </div>
                  </div>
                  {imageUrl && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={imageUrl}
                        alt="Preview tài liệu"
                        style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        onError={(e) => {
                          ;(e.target as any).style.display = 'none'
                        }}
                      />
                      <span style={{ fontSize: 12.5, color: '#64748b' }}>Xem trước ảnh đính kèm hợp lệ</span>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    {submitting ? (
                      <span>Đang gửi thông tin...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Gửi Phản Hồi Đến BQT Sàn</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: History List */}
          {activeTab === 'history' && (
            <div style={{ padding: '24px' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Đang tải danh sách khiếu nại...</div>
                </div>
              ) : feedbacks.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                  <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>
                    Chưa có phản hồi nào được gửi
                  </p>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    Quý nhà bán có thể tạo phiếu phản hồi mới ở tab bên cạnh khi cần hỗ trợ.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 12.5, fontWeight: 600 }}>
                        <th style={{ padding: '12px 14px' }}>Mã phiếu</th>
                        <th style={{ padding: '12px 14px' }}>Phân loại</th>
                        <th style={{ padding: '12px 14px' }}>Chủ đề</th>
                        <th style={{ padding: '12px 14px' }}>Thời gian</th>
                        <th style={{ padding: '12px 14px' }}>Trạng thái</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks.map((item) => {
                        const typeInfo = getTypeLabel(item.type)
                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'background-color 0.15s'
                            }}
                          >
                            <td style={{ padding: '14px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                              {item.id}
                            </td>
                            <td style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155' }}>
                                {typeInfo.icon}
                                <span>{typeInfo.label}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px', maxWidth: 320 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.subject}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.content}
                              </div>
                            </td>
                            <td style={{ padding: '14px', fontSize: 12.5, color: '#64748b' }}>
                              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding: '14px' }}>
                              {getStatusPill(item.status)}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setViewingFeedback(item)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#eff6ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: 6,
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <span>Xem phản hồi</span>
                                <ChevronRight size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Xem chi tiết phản hồi từ Admin */}
        {viewingFeedback && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(3px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setViewingFeedback(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 14,
                width: '100%',
                maxWidth: 640,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc'
                }}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Chi Tiết Phiếu Khiếu Nại [{viewingFeedback.id}]
                  </h3>
                  <div style={{ marginTop: 4 }}>{getStatusPill(viewingFeedback.status)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingFeedback(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748b', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Chủ đề:
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {viewingFeedback.subject}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Nội dung đã gửi:
                  </span>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: '#334155',
                      padding: '12px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      marginTop: 4,
                      lineHeight: 1.5
                    }}
                  >
                    {viewingFeedback.content}
                  </div>
                </div>

                {viewingFeedback.imageUrl && (
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      Ảnh minh chứng:
                    </span>
                    <div style={{ marginTop: 6 }}>
                      <img
                        src={viewingFeedback.imageUrl}
                        alt="Minh chứng"
                        style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                )}

                {/* Admin Response Box */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 10,
                    backgroundColor: viewingFeedback.adminResponse ? '#f0fdf4' : '#fffbeb',
                    border: `1.5px solid ${viewingFeedback.adminResponse ? '#bbf7d0' : '#fef08a'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MessageSquare size={16} color={viewingFeedback.adminResponse ? '#16a34a' : '#d97706'} />
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: viewingFeedback.adminResponse ? '#166534' : '#92400e'
                      }}
                    >
                      {viewingFeedback.adminResponse ? 'Phản Hồi Từ Ban Quản Trị Sàn' : 'Đang Chờ BQT Phản Hồi'}
                    </span>
                  </div>

                  {viewingFeedback.adminResponse ? (
                    <div>
                      <div style={{ fontSize: 14, color: '#14532d', lineHeight: 1.6 }}>
                        {viewingFeedback.adminResponse}
                      </div>
                      <div style={{ fontSize: 12, color: '#15803d', marginTop: 8 }}>
                        Người phụ trách: <strong>{viewingFeedback.resolvedBy || 'Ban Quản trị WebChicKen'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#78350f' }}>
                      Phiếu hỗ trợ đang trong hàng đợi xử lý. Quản trị viên sẽ sớm kiểm tra và phản hồi trực tiếp tại đây.
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  padding: '14px 24px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  textAlign: 'right'
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewingFeedback(null)}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  )
}
