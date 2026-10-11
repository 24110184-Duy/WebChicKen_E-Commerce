import React, { useState, useEffect, useCallback } from 'react'
import {
  HelpCircle,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  Mail,
  User
} from 'lucide-react'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { useAuthStore } from '../../app/store/authStore'
import {
  submitCustomerFeedback,
  fetchMyFeedbacks
} from '../../features/shop/api/feedbackApi'
import {
  type FeedbackItem,
  type FeedbackType,
  type FeedbackStatus,
  formatAdminResolver
} from '../../features/shop/types/feedbackTypes'
import { toast } from '../../components/feedback/Toast'
import { Link } from 'react-router-dom'
import { PATHS } from '../../app/router/paths'

export const HelpCenterPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  // Active Tab: 'submit' | 'history' | 'faq'
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'faq'>('submit')

  // Form State
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('SYSTEM_BUG')
  const [subject, setSubject] = useState('')
  const [targetRef, setTargetRef] = useState('') // Tên shop, link sản phẩm, mã đơn
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // My Tickets State
  const [myTickets, setMyTickets] = useState<FeedbackItem[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedTicket, setSelectedTicket] = useState<FeedbackItem | null>(null)

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  // Tải danh sách tickets đã gửi của user
  const loadMyTickets = useCallback(async () => {
    if (!isAuthenticated) return
    setLoadingTickets(true)
    try {
      const res = await fetchMyFeedbacks(1, 50)
      setMyTickets(res.items || [])
    } catch (err) {
      console.warn('Lỗi khi tải lịch sử phiếu hỗ trợ:', err)
    } finally {
      setLoadingTickets(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'history') {
      loadMyTickets()
    }
  }, [activeTab, loadMyTickets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập tài khoản để gửi phản hồi / tố cáo cho Ban Quản Trị!')
      return
    }

    if (!subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề phản ánh!')
      return
    }

    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung mô tả chi tiết vấn đề!')
      return
    }

    setSubmitting(true)
    try {
      // Kết hợp targetRef vào nội dung nếu có
      let fullContent = content.trim()
      if (targetRef.trim()) {
        fullContent = `[Đối tượng / Liên quan: ${targetRef.trim()}]\n\n${fullContent}`
      }

      await submitCustomerFeedback({
        type: feedbackType,
        subject: subject.trim(),
        content: fullContent,
        imageUrl: imageUrl.trim() || undefined
      })

      toast.success('Gửi phản hồi / tố cáo thành công! Ban Quản Trị sẽ xử lý ngay.')
      setSubject('')
      setTargetRef('')
      setContent('')
      setImageUrl('')

      // Chuyển sang xem lịch sử phiếu
      setActiveTab('history')
      loadMyTickets()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi phản hồi.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="hc-status-badge hc-status-pending">
            <Clock size={12} /> Chờ BQT tiếp nhận
          </span>
        )
      case 'IN_REVIEW':
        return (
          <span className="hc-status-badge hc-status-review">
            <Clock size={12} /> Đang điều tra xử lý
          </span>
        )
      case 'RESOLVED':
        return (
          <span className="hc-status-badge hc-status-resolved">
            <CheckCircle2 size={12} /> Đã giải quyết
          </span>
        )
      case 'REJECTED':
        return (
          <span className="hc-status-badge hc-status-rejected">
            <AlertCircle size={12} /> Đã từ chối
          </span>
        )
      default:
        return <span className="hc-status-badge hc-status-pending">{status}</span>
    }
  }

  const getTypeBadge = (type: FeedbackType) => {
    switch (type) {
      case 'SYSTEM_BUG':
        return <span className="hc-ticket-badge-type hc-badge-bug">Báo Lỗi Hệ Thống</span>
      case 'STORE_REPORT':
      case 'COMPLAINT':
        return <span className="hc-ticket-badge-type hc-badge-report">Tố Cáo Vi Phạm</span>
      case 'PAYMENT':
        return <span className="hc-ticket-badge-type hc-badge-payment">Thanh Toán & Đơn Hàng</span>
      case 'SUGGESTION':
        return <span className="hc-ticket-badge-type hc-badge-suggestion">Góp Ý Cải Tiến</span>
      default:
        return <span className="hc-ticket-badge-type hc-badge-inquiry">Thắc Mắc Khác</span>
    }
  }

  const filteredTickets = myTickets.filter((item) => {
    if (statusFilter === 'ALL') return true
    return item.status === statusFilter
  })

  const faqs = [
    {
      q: '1. Quy trình xử lý khi phát hiện gian hàng bán hàng giả hoặc lừa đảo?',
      a: 'Ban Quản Trị ChickyMart áp dụng chính sách "Không khoan nhượng" đối với hàng giả và gian lận thương mại. Ngay khi tiếp nhận tố cáo kèm bằng chứng, BQT sẽ tạm khóa sản phẩm/gian hàng trong vòng 2 - 4 giờ làm việc để thanh tra. Người mua sẽ được hoàn tiền 100% nếu xác nhận sản phẩm vi phạm.'
    },
    {
      q: '2. Tôi báo lỗi hệ thống website thì có được hỗ trợ hay khen thưởng không?',
      a: 'ChickyMart luôn ghi nhận và tri ân đóng góp của người dùng. Với các báo cáo lỗi hệ thống, lỗ hổng bảo mật hoặc lỗi thanh toán chính xác, BQT sẽ gửi thư cảm ơn và tặng Voucher mua sắm trị giá từ 50.000₫ đến 500.000₫ vào tài khoản của bạn.'
    },
    {
      q: '3. Tài khoản đã bị trừ tiền ngân hàng nhưng đơn hàng báo "Chưa thanh toán"?',
      a: 'Do độ trễ mạng hoặc cổng thanh toán đối soát, đơn hàng có thể cập nhật trong 5 - 15 phút. Nếu sau 15 phút đơn hàng vẫn chưa đổi trạng thái, bạn hãy gửi phiếu tại mục "Khiếu nại Đơn & Thanh Toán" kèm mã giao dịch ngân hàng để Admin đối soát cộng tiền/tạo đơn ngay.'
    },
    {
      q: '4. Thông tin tố cáo và danh tính của tôi có được bảo mật không?',
      a: '100% danh tính, thông tin cá nhân và tài khoản của người gửi tố cáo được BQT bảo mật tuyệt đối theo Tiêu chuẩn Bảo Mật ChickyMart và Luật An Toàn Thông Tin Mạng. Gian hàng bị tố cáo hoàn toàn không biết ai là người gửi báo cáo.'
    },
    {
      q: '5. Làm thế nào để theo dõi tiến độ xử lý phiếu phản hồi của tôi?',
      a: 'Bạn chỉ cần chuyển sang tab "Lịch sử yêu cầu đã gửi" trên trang này. Khi Ban Quản Trị có kết quả xử lý hoặc giải pháp phúc đáp, toàn bộ nội dung trả lời sẽ hiển thị chi tiết tại phiếu của bạn.'
    }
  ]

  return (
    <StorefrontLayout>
      <div className="hc-wrapper">
        {/* 1. Hero Banner */}
        <div className="hc-hero">
          <div className="hc-hero-content">
            <div className="hc-hero-tag">
              <ShieldCheck size={14} />
              Trung Tâm Hỗ Trợ & Khiếu Nại ChickyMart
            </div>
            <h1 className="hc-hero-title">
              Chúng Tôi Luôn Lắng Nghe & Đồng Hành Cùng Bạn
            </h1>
            <p className="hc-hero-desc">
              Gặp lỗi kỹ thuật trên sàn? Phát hiện gian hàng vi phạm chính sách? Hoặc cần hỗ trợ đơn hàng? Hãy gửi phản ánh trực tiếp tới Ban Quản Trị để được giải quyết nhanh nhất.
            </p>
            <div className="hc-hero-quick-actions">
              <button
                type="button"
                onClick={() => setActiveTab('submit')}
                className={activeTab === 'submit' ? 'hc-btn-primary' : 'hc-btn-secondary'}
              >
                <Send size={16} />
                Gửi Báo Lỗi / Tố Cáo Ngay
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={activeTab === 'history' ? 'hc-btn-primary' : 'hc-btn-secondary'}
              >
                <FileText size={16} />
                Lịch Sử Phiếu Của Tôi ({myTickets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={activeTab === 'faq' ? 'hc-btn-primary' : 'hc-btn-secondary'}
              >
                <HelpCircle size={16} />
                Câu Hỏi Thường Gặp
              </button>
            </div>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="hc-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`hc-tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          >
            <Send size={16} />
            Gửi Báo Lỗi & Tố Cáo Cho Admin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`hc-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          >
            <FileText size={16} />
            Lịch Sử Phiếu Đã Gửi ({myTickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`hc-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          >
            <HelpCircle size={16} />
            Quy Định & Hỏi Đáp (FAQ)
          </button>
        </div>

        {/* 3. TAB 1: FORM GỬI PHẢN HỒI / BÁO LỖI / TỐ CÁO */}
        {activeTab === 'submit' && (
          <div>
            {/* Form chi tiết */}
            <div className="hc-form-card">
              <div className="hc-form-header">
                <div className="hc-form-title">
                  Phiếu Yêu Cầu Hỗ Trợ, Báo Lỗi & Tố Cáo
                </div>
                <div className="hc-form-sub">
                  Vui lòng chọn phân loại và cung cấp thông tin cụ thể để Ban Quản Trị xác minh và giải quyết kịp thời.
                </div>
              </div>

              {!isAuthenticated && (
                <div style={{
                  padding: '12px 18px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 12,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertCircle size={20} color="#d97706" />
                    <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                      Bạn chưa đăng nhập. Vui lòng đăng nhập để gửi phiếu và theo dõi tiến độ giải quyết nhé!
                    </span>
                  </div>
                  <Link
                    to={PATHS.LOGIN}
                    style={{
                      padding: '6px 16px',
                      background: '#f59e0b',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 8,
                      textDecoration: 'none'
                    }}
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* 1. Phân loại yêu cầu (Dropdown) */}
                <div className="hc-form-group">
                  <label htmlFor="hc-feedback-type" className="hc-label">
                    1. Phân Loại Yêu Cầu Hỗ Trợ <span>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="hc-feedback-type"
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                      className="hc-input"
                      style={{
                        paddingRight: 40,
                        appearance: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="SYSTEM_BUG">Báo lỗi hệ thống — (Sự cố kỹ thuật, lỗi chức năng, giỏ hàng, thanh toán)</option>
                      <option value="STORE_REPORT">Tố cáo gian hàng / sản phẩm — (Hàng giả, gian lận, lừa đảo, vi phạm quy định sàn)</option>
                      <option value="PAYMENT">Khiếu nại đơn & thanh toán — (Bị trừ tiền chưa có đơn, khiếu nại hoàn tiền, giao trễ)</option>
                      <option value="SUGGESTION">Đề xuất cải tiến — (Góp ý tính năng mới, nâng cao trải nghiệm mua sắm)</option>
                      <option value="INQUIRY">Thắc mắc vận hành & hỗ trợ khác — (Quy chế sàn, mã voucher, quyền lợi thành viên)</option>
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#64748b'
                      }}
                    />
                  </div>
                </div>
                {/* Tiêu đề */}
                <div className="hc-form-group">
                  <label className="hc-label">
                    Tiêu Đề Phản Ánh / Tố Cáo <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="VD: Gian hàng XYZ có hành vi gian lận / Lỗi không thêm được voucher thanh toán..."
                    maxLength={255}
                    required
                    className="hc-input"
                  />
                </div>

                {/* Đối tượng liên quan */}
                <div className="hc-form-group">
                  <label className="hc-label">
                    Đối Tượng / Mã Đơn / Liên Kết Liên Quan (Nếu có)
                  </label>
                  <input
                    type="text"
                    value={targetRef}
                    onChange={(e) => setTargetRef(e.target.value)}
                    placeholder="VD: Tên Shop, Mã đơn #ORD-12345, hoặc Link sản phẩm bị lỗi / vi phạm..."
                    className="hc-input"
                  />
                </div>

                {/* Nội dung chi tiết */}
                <div className="hc-form-group">
                  <label className="hc-label">
                    Nội Dung Mô Tả Chi Tiết Sự Việc <span>*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả cụ thể sự việc bạn gặp phải, các bước dẫn tới lỗi, hoặc hành vi vi phạm của gian hàng cần tố cáo..."
                    required
                    className="hc-textarea"
                  />
                </div>

                {/* Ảnh minh chứng */}
                <div className="hc-form-group">
                  <label className="hc-label">
                    Liên Kết Hình Ảnh / Bằng Chứng Đính Kèm (Ảnh chụp màn hình)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/evidence-screenshot.png"
                      className="hc-input"
                    />
                  </div>
                </div>

                {/* Banner cam kết bảo mật */}
                <div className="hc-security-banner">
                  <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Cam Kết Bảo Mật Tuyệt Đối:</strong> Mọi thông tin tố cáo và danh tính của bạn đều được Ban Quản Trị ChickyMart bảo mật 100%. Các gian hàng không thể tiếp cận danh tính người báo cáo.
                  </div>
                </div>

                {/* Nút gửi */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="submit"
                    disabled={submitting || !isAuthenticated}
                    className="hc-btn-primary"
                    style={{ opacity: !isAuthenticated ? 0.6 : 1 }}
                  >
                    <Send size={16} />
                    <span>{submitting ? 'Đang gửi tới Admin...' : 'Gửi Phiếu Cho Ban Quản Trị'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. TAB 2: LỊCH SỬ PHIẾU ĐÃ GỬI */}
        {activeTab === 'history' && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Danh Sách Phiếu Hỗ Trợ & Tố Cáo Của Bạn
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                  Theo dõi kết quả xác minh và câu trả lời giải quyết từ Ban Quản Trị.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Bộ lọc trạng thái */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1e293b',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="IN_REVIEW">Đang kiểm tra</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                  <option value="REJECTED">Đã từ chối</option>
                </select>

                <button
                  type="button"
                  onClick={loadMyTickets}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: '#475569'
                  }}
                  title="Làm mới danh sách"
                >
                  <RefreshCw size={14} />
                  Làm mới
                </button>
              </div>
            </div>

            {!isAuthenticated ? (
              <div style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <User size={48} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  Vui lòng đăng nhập để xem lịch sử phiếu
                </h4>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                  Đăng nhập tài khoản giúp bạn xem phản hồi và phúc đáp trực tiếp từ BQT ChickyMart.
                </p>
                <Link
                  to={PATHS.LOGIN}
                  className="hc-btn-primary"
                  style={{ display: 'inline-flex' }}
                >
                  Đăng nhập tài khoản
                </Link>
              </div>
            ) : loadingTickets ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Đang tải danh sách phiếu hỗ trợ của bạn...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <FileText size={48} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  Chưa có phiếu hỗ trợ nào
                </h4>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                  Khi bạn gửi báo lỗi hoặc tố cáo, toàn bộ tiến trình xử lý sẽ xuất hiện tại đây.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('submit')}
                  className="hc-btn-primary"
                  style={{ display: 'inline-flex' }}
                >
                  Gửi phiếu phản ánh ngay
                </button>
              </div>
            ) : (
              <div className="hc-tickets-container">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="hc-ticket-card"
                    onClick={() => setSelectedTicket(t)}
                  >
                    <div className="hc-ticket-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {getTypeBadge(t.type)}
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          Mã phiếu: <strong>#{t.id.slice(0, 8)}</strong>
                        </span>
                      </div>
                      <div>{getStatusBadge(t.status)}</div>
                    </div>

                    <div className="hc-ticket-title">{t.subject}</div>
                    <div className="hc-ticket-content">{t.content}</div>

                    {/* Ảnh minh chứng nếu có */}
                    {t.imageUrl && (
                      <div style={{ marginBottom: 10 }}>
                        <a
                          href={t.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ImageIcon size={14} />
                          Xem ảnh minh chứng đã đính kèm
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* Hộp phản hồi từ Admin nếu đã có phản hồi */}
                    {t.adminResponse && (
                      <div className="hc-admin-reply-box">
                        <div className="hc-admin-reply-title">
                          <CheckCircle2 size={14} />
                          Phúc Đáp Từ Ban Quản Trị ChickyMart:
                        </div>
                        <div className="hc-admin-reply-text">{t.adminResponse}</div>
                        {t.resolvedBy && (
                          <div style={{ fontSize: 11, color: '#166534', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ShieldCheck size={12} color="#166534" />
                            <span>Xử lý bởi: {formatAdminResolver(t.resolvedBy)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      paddingTop: 10,
                      borderTop: '1px solid #f1f5f9',
                      fontSize: 11,
                      color: '#94a3b8'
                    }}>
                      <span>Gửi lúc: {new Date(t.createdAt).toLocaleString('vi-VN')}</span>
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        Bấm để xem chi tiết &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. TAB 3: FAQ VÀ QUY ĐỊNH SÀN */}
        {activeTab === 'faq' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Câu Hỏi Thường Gặp & Hướng Dẫn Giải Quyết Khiếu Nại
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                Tổng hợp câu hỏi và hướng dẫn nhanh giúp bạn tự giải quyết vấn đề nhanh chóng.
              </p>
            </div>

            <div style={{ marginBottom: 28 }}>
              {faqs.map((faq, index) => {
                const isOpen = expandedFaq === index
                return (
                  <div key={index} className="hc-faq-card">
                    <div
                      className="hc-faq-question"
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={18} color="#d97706" /> : <ChevronDown size={18} color="#94a3b8" />}
                    </div>
                    {isOpen && (
                      <div className="hc-faq-answer">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Hotline & Email card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
            }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Cần Hỗ Trợ Khẩn Cấp Trực Tiếp?
                </h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Đội ngũ Chăm Sóc Khách Hàng ChickyMart luôn sẵn sàng phục vụ bạn 24/7.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <a
                  href="tel:1900-CHICKY"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#fef3c7',
                    color: '#b45309',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none'
                  }}
                >
                  <PhoneCall size={16} />
                  Hotline: 1900-CHICKY
                </a>

                <a
                  href="mailto:support@webchicken.com"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#f1f5f9',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none'
                  }}
                >
                  <Mail size={16} />
                  support@webchicken.com
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MODAL XEM CHI TIẾT PHIẾU CỦA USER */}
        {selectedTicket && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 580,
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid #f1f5f9',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {getTypeBadge(selectedTicket.type)}
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                    #{selectedTicket.id.slice(0, 8)}
                  </span>
                </div>
                <div>{getStatusBadge(selectedTicket.status)}</div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                {selectedTicket.subject}
              </h3>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 13,
                color: '#334155',
                lineHeight: 1.6,
                marginBottom: 16,
                whiteSpace: 'pre-wrap'
              }}>
                {selectedTicket.content}
              </div>

              {selectedTicket.imageUrl && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                    Ảnh minh chứng:
                  </span>
                  <img
                    src={selectedTicket.imageUrl}
                    alt="Minh chứng"
                    style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}

              {/* Phản hồi từ BQT */}
              <div style={{
                background: selectedTicket.adminResponse ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${selectedTicket.adminResponse ? '#bbf7d0' : '#fef08a'}`,
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 20
              }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: selectedTicket.adminResponse ? '#166534' : '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6
                }}>
                  {selectedTicket.adminResponse ? (
                    <>
                      <CheckCircle2 size={16} />
                      Phúc Đáp Chính Thức Từ Ban Quản Trị ChickyMart
                    </>
                  ) : (
                    <>
                      <Clock size={16} />
                      Phiếu Đang Trong Hàng Đợi Xác Minh
                    </>
                  )}
                </div>
                <div style={{
                  fontSize: 13,
                  color: selectedTicket.adminResponse ? '#14532d' : '#92400e',
                  lineHeight: 1.6
                }}>
                  {selectedTicket.adminResponse ||
                    'Ban Quản Trị đã ghi nhận phiếu của bạn và đang tiến hành điều tra, đối soát thông tin. Chúng tôi sẽ phản hồi lại ngay tại đây khi có kết quả!'}
                </div>
                {selectedTicket.resolvedBy && (
                  <div style={{
                    fontSize: 12,
                    color: '#166534',
                    marginTop: 8,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <ShieldCheck size={14} color="#166534" />
                    <span>Xử lý bởi: <strong>{formatAdminResolver(selectedTicket.resolvedBy)}</strong></span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: 10,
                    background: '#e2e8f0',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: 13,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  )
}

export default HelpCenterPage
