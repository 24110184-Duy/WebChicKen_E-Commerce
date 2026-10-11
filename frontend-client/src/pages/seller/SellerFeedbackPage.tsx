import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  Image as ImageIcon,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
  Search,
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import type {
  FeedbackItem,
  FeedbackType,
  CreateFeedbackPayload,
} from '../../features/shop/types/feedbackTypes'
import {
  submitSellerFeedback,
  fetchSellerFeedbacks,
} from '../../features/shop/api/feedbackApi'
import { sellerApi } from '../../features/seller/api/sellerApi'

export const SellerFeedbackPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = tabParam === 'history' ? 'history' : 'create'

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [type, setType] = useState<FeedbackType>('INQUIRY')
  const [subject, setSubject] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadFileName, setUploadFileName] = useState<string>('')
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // History search & filter states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')

  // Selected feedback for viewing response modal
  const [viewingFeedback, setViewingFeedback] = useState<FeedbackItem | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadSellerFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchSellerFeedbacks(1, 50)
      setFeedbacks(data.items || [])
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sử phản hồi seller:', err)
      showToast('Không thể tải lịch sử phản hồi.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSellerFeedbacks()
  }, [loadSellerFeedbacks])

  const handleTabChange = (tab: 'create' | 'history') => {
    if (tab === 'history') {
      setSearchParams({ tab: 'history' })
    } else {
      setSearchParams({})
    }
  }

  // Upload proof image from local file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Hỗ trợ kiểm tra linh hoạt MIME type hoặc đuôi file phổ biến
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|jfif|bmp)$/i.test(file.name)
    if (!isImage) {
      showToast('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP, GIF).', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 5MB.', 'error')
      return
    }

    // Hiển thị xem trước ảnh ngay lập tức bằng local Blob URL
    const localBlobUrl = URL.createObjectURL(file)
    setPreviewUrl(localBlobUrl)
    setUploadFileName(file.name)
    setImageStatus('loading')

    try {
      setUploadingImage(true)
      const uploadedServerUrl = await sellerApi.uploadProductImage(file)
      setImageUrl(uploadedServerUrl)
      setImageStatus('loaded')
      showToast('Tải ảnh minh chứng lên thành công!', 'success')
    } catch (err: any) {
      console.error('Lỗi tải ảnh lên máy chủ:', err)
      setImageStatus('error')
      showToast(err?.message || 'Không thể tải ảnh lên máy chủ.', 'error')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Nhập đường dẫn ảnh từ mạng
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim()

    // Tự động trích xuất imgurl nếu dán liên kết tìm kiếm ảnh Google
    if (val.includes('imgurl=')) {
      try {
        const match = val.match(/[?&]imgurl=([^&]+)/)
        if (match && match[1]) {
          val = decodeURIComponent(match[1])
        }
      } catch {}
    }

    setImageUrl(val)
    setPreviewUrl(val)
    setUploadFileName('')
    if (val) {
      setImageStatus('loading')
    } else {
      setImageStatus('idle')
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setPreviewUrl('')
    setUploadFileName('')
    setImageStatus('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      setFormError('Vui lòng nhập tiêu đề phản hồi hoặc khiếu nại.')
      return
    }
    if (!content.trim()) {
      setFormError('Vui lòng nhập nội dung chi tiết để Ban Quản Trị có thể xử lý.')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)

      const payload: CreateFeedbackPayload = {
        type,
        subject: subject.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      }

      const created = await submitSellerFeedback(payload)
      showToast('Đã gửi phiếu hỗ trợ đến Ban Quản Trị sàn thành công!', 'success')

      // Reset form
      setSubject('')
      setContent('')
      handleRemoveImage()
      setType('INQUIRY')

      // Cập nhật danh sách và chuyển sang tab lịch sử
      setFeedbacks((prev) => [created, ...prev])
      handleTabChange('history')
    } catch (err: any) {
      setFormError(err?.message || 'Có lỗi xảy ra khi gửi phản hồi.')
      showToast('Không thể gửi phiếu hỗ trợ. Vui lòng kiểm tra lại.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = feedbacks.filter((f) => f.status === 'PENDING').length
  const inReviewCount = feedbacks.filter((f) => f.status === 'IN_REVIEW').length
  const resolvedCount = feedbacks.filter((f) => f.status === 'RESOLVED').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: '#fef9c3',
              color: '#854d0e',
            }}
          >
            <Clock size={11} />
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
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
            }}
          >
            <RefreshCw size={11} />
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
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: '#dcfce7',
              color: '#15803d',
            }}
          >
            <CheckCircle2 size={11} />
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
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
            }}
          >
            <AlertCircle size={11} />
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
        return { label: 'Khiếu nại kiểm duyệt / đơn', tag: 'Ưu tiên cao', icon: <ShieldAlert size={14} color="#dc2626" /> }
      case 'INQUIRY':
        return { label: 'Thắc mắc vận hành sàn', tag: 'Vận hành', icon: <HelpCircle size={14} color="#ca8a04" /> }
      case 'SUGGESTION':
        return { label: 'Đề xuất cải tiến tính năng', tag: 'Góp ý', icon: <Lightbulb size={14} color="#16a34a" /> }
      case 'SYSTEM_BUG':
        return { label: 'Báo lỗi hệ thống kỹ thuật', tag: 'Kỹ thuật', icon: <Bug size={14} color="#d97706" /> }
      default:
        return { label: 'Ý kiến khác', tag: 'Chung', icon: <FileText size={14} color="#64748b" /> }
    }
  }

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false
      if (filterType !== 'ALL' && item.type !== filterType) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchId = item.id?.toLowerCase().includes(q)
        const matchSubject = item.subject?.toLowerCase().includes(q)
        const matchContent = item.content?.toLowerCase().includes(q)
        if (!matchId && !matchSubject && !matchContent) return false
      }
      return true
    })
  }, [feedbacks, filterStatus, filterType, searchQuery])

  return (
    <SellerLayout>
      <div style={{ padding: '20px 24px', backgroundColor: '#f6f6f6', minHeight: 'calc(100vh - 64px)' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: 6,
              backgroundColor: toastMessage.type === 'success' ? '#0f766e' : '#b91c1c',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* ── Page Header (Chuẩn style Seller Portal) ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HelpCircle style={{ width: 22, height: 22, color: '#ca8a04' }} />
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Help & Feedback (Hỗ trợ & Gửi phản hồi Admin)
                </h1>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 32px' }}>
                Kênh kết nối chính thức giữa Nhà Bán Hàng và Ban Quản Trị Sàn WebChicKen Marketplace.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSellerFeedbacks}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#ffffff',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: '#595959',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>

        {/* ── Metric Summary Cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '16px 20px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tổng số phản hồi</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {feedbacks.length}
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
              }}
            >
              <FileText size={18} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '16px 20px',
              borderRadius: 6,
              border: '1px solid #fef08a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#854d0e' }}>Chờ BQT tiếp nhận</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ca8a04', marginTop: 4 }}>
                {pendingCount}
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#fefce8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ca8a04',
              }}
            >
              <Clock size={18} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '16px 20px',
              borderRadius: 6,
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af' }}>Đang giải quyết</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                {inReviewCount}
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <RefreshCw size={18} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '16px 20px',
              borderRadius: 6,
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>Đã giải quyết xong</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                {resolvedCount}
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* ── Main Tab Bar (Shopee / Seller Center style) ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '4px 4px 0 0',
            borderBottom: '1px solid #e8e8e8',
            display: 'flex',
            padding: '0 16px',
            gap: 28,
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('create')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '16px 4px',
              fontSize: 14,
              fontWeight: activeTab === 'create' ? 700 : 500,
              color: activeTab === 'create' ? '#ca8a04' : '#595959',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'color 0.15s ease',
            }}
          >
            <Send size={15} />
            <span>Gửi phiếu hỗ trợ mới</span>
            {activeTab === 'create' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: '#eab308',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('history')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '16px 4px',
              fontSize: 14,
              fontWeight: activeTab === 'history' ? 700 : 500,
              color: activeTab === 'history' ? '#ca8a04' : '#595959',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'color 0.15s ease',
            }}
          >
            <FileText size={15} />
            <span>Lịch sử phiếu hỗ trợ</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '1px 7px',
                borderRadius: 12,
                backgroundColor: activeTab === 'history' ? '#fef08a' : '#f1f5f9',
                color: activeTab === 'history' ? '#854d0e' : '#64748b',
              }}
            >
              {feedbacks.length}
            </span>
            {activeTab === 'history' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: '#eab308',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'create' ? (
          /* ========================================================= */
          /* VIEW 1: GỬI PHIẾU HỖ TRỢ MỚI                             */
          /* ========================================================= */
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0 0 4px 4px',
              border: '1px solid #e8e8e8',
              borderTop: 'none',
              padding: 24,
              marginBottom: 20,
            }}
          >
            {/* Notice banner */}
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: '#fefce8',
                borderRadius: 6,
                border: '1px solid #fef08a',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Sparkles size={20} color="#ca8a04" />
              <span style={{ fontSize: 13, color: '#854d0e', lineHeight: 1.5 }}>
                Ban Quản Trị WebChicKen cam kết tiếp nhận và phản hồi mọi yêu cầu của nhà bán hàng trong vòng{' '}
                <strong>24 - 48 giờ làm việc</strong>. Vui lòng cung cấp thông tin minh bạch, chính xác để được hỗ trợ nhanh nhất.
              </span>
            </div>

            {formError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 6,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#b91c1c',
                  fontSize: 13,
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Mục 1: Phân loại yêu cầu */}
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                  1. Phân loại yêu cầu hỗ trợ <span style={{ color: '#ef4444' }}>*</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    { id: 'INQUIRY', name: 'Thắc mắc vận hành', desc: 'Quy trình giao nhận, ví tiền & thanh toán', tag: 'Vận hành' },
                    { id: 'COMPLAINT', name: 'Khiếu nại kiểm duyệt / đơn', desc: 'Kiểm duyệt sản phẩm, xử lý trả hàng', tag: 'Ưu tiên' },
                    { id: 'SUGGESTION', name: 'Đề xuất cải tiến', desc: 'Góp ý tính năng mới cho sàn ChickyMart', tag: 'Góp ý' },
                    { id: 'SYSTEM_BUG', name: 'Báo lỗi hệ thống', desc: 'Lỗi giao diện, không lưu được dữ liệu', tag: 'Kỹ thuật' },
                    { id: 'OTHER', name: 'Ý kiến khác', desc: 'Các câu hỏi hoặc hợp tác kinh doanh khác', tag: 'Chung' },
                  ].map((item) => {
                    const isSelected = type === item.id
                    return (
                      <div
                        key={item.id}
                        onClick={() => setType(item.id as FeedbackType)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          borderRadius: 6,
                          border: isSelected ? '1.5px solid #eab308' : '1px solid #f1f5f9',
                          backgroundColor: isSelected ? '#fefce8' : '#fafafa',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 13.5, color: isSelected ? '#854d0e' : '#1e293b' }}>
                              {item.name}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 10,
                                backgroundColor: isSelected ? '#fef08a' : '#e2e8f0',
                                color: isSelected ? '#854d0e' : '#475569',
                                fontWeight: 600,
                              }}
                            >
                              {item.tag}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mục 2: Chi tiết nội dung */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                  2. Chi tiết nội dung phản hồi / khiếu nại
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Tiêu đề */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      Tiêu đề phản hồi <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ví dụ: Khiếu nại thời gian kiểm duyệt sản phẩm 'Thịt gà ta thả vườn'..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 4,
                        fontSize: 13.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Nội dung chi tiết */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      Nội dung chi tiết <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Mô tả cụ thể vấn đề quý nhà bán gặp phải, mã đơn hàng, mã sản phẩm hoặc thông tin liên quan để Ban Quản Trị dễ dàng tra cứu..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 4,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Ảnh minh chứng / Tài liệu đính kèm */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                      Ảnh minh chứng đính kèm (Biên bản giao nhận, ảnh lỗi, giấy tờ kiểm dịch nếu có)
                    </label>

                    {/* Lựa chọn phương thức: Tải ảnh từ máy tính hoặc Nhập URL */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 4,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: uploadMode === 'file' ? '1px solid #eab308' : '1px solid #cbd5e1',
                          backgroundColor: uploadMode === 'file' ? '#fefce8' : '#ffffff',
                          color: uploadMode === 'file' ? '#854d0e' : '#64748b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Upload size={14} />
                        <span>Tải ảnh từ máy tính</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 4,
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: uploadMode === 'url' ? '1px solid #eab308' : '1px solid #cbd5e1',
                          backgroundColor: uploadMode === 'url' ? '#fefce8' : '#ffffff',
                          color: uploadMode === 'url' ? '#854d0e' : '#64748b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <ImageIcon size={14} />
                        <span>Dùng đường dẫn ảnh (URL)</span>
                      </button>
                    </div>

                    {/* Mode 1: Tải từ máy tính */}
                    {uploadMode === 'file' ? (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.jfif"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                        />

                        {!imageUrl ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              border: '2px dashed #cbd5e1',
                              borderRadius: 6,
                              padding: '24px 20px',
                              textAlign: 'center',
                              backgroundColor: '#fafafa',
                              cursor: uploadingImage ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Upload size={26} color="#ca8a04" style={{ margin: '0 auto 8px' }} className={uploadingImage ? 'spin' : ''} />
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                              {uploadingImage ? 'Đang tải ảnh lên máy chủ...' : 'Bấm vào đây để chọn ảnh từ máy tính của bạn'}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                              Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Dung lượng tối đa 5MB)
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      /* Mode 2: Nhập đường dẫn URL */
                      <div>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={imageUrl}
                            onChange={handleUrlChange}
                            placeholder="Dán đường dẫn ảnh trực tiếp (VD: https://images.unsplash.com/... hoặc /api/v1/media/files/...)"
                            style={{
                              width: '100%',
                              padding: '10px 14px 10px 36px',
                              border: '1px solid #cbd5e1',
                              borderRadius: 4,
                              fontSize: 13,
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          <ImageIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 5 }}>
                          * Lưu ý: Đường dẫn phải là liên kết xem trực tiếp tệp ảnh (kết thúc bằng .jpg, .png, .webp...).
                        </div>
                      </div>
                    )}

                    {/* Khung xem trước ảnh đính kèm (Hiển thị đẹp mắt, có trạng thái rõ ràng) */}
                    {imageUrl && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: '14px 18px',
                          backgroundColor: '#ffffff',
                          border: imageStatus === 'error' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              overflow: 'hidden',
                              backgroundColor: '#f8fafc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {imageStatus === 'error' ? (
                              <AlertCircle size={26} color="#ef4444" />
                            ) : (
                              <img
                                src={previewUrl || imageUrl}
                                alt="Minh chứng đính kèm"
                                onLoad={() => setImageStatus('loaded')}
                                onError={() => setImageStatus('error')}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )}
                          </div>

                          <div style={{ overflow: 'hidden' }}>
                            {imageStatus === 'error' ? (
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <AlertCircle size={15} />
                                  <span>Không thể tải hình ảnh từ liên kết này</span>
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                                  Đường dẫn bạn nhập không phải là tệp ảnh hợp lệ. Vui lòng kiểm tra lại liên kết hoặc bấm &quot;Tải ảnh từ máy tính&quot;.
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <CheckCircle2 size={15} />
                                  <span>Đã đính kèm ảnh minh chứng hợp lệ</span>
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: '#64748b',
                                    marginTop: 3,
                                    maxWidth: 420,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={uploadFileName || imageUrl}
                                >
                                  {uploadFileName ? `Tệp: ${uploadFileName}` : imageUrl}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={{
                            padding: '7px 14px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: 4,
                            color: '#b91c1c',
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          <X size={13} />
                          <span>Xóa ảnh</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#facc15',
                    border: 'none',
                    color: '#0f172a',
                    padding: '10px 24px',
                    borderRadius: 4,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Send size={15} />
                  <span>{submitting ? 'Đang gửi thông tin...' : 'Gửi phiếu hỗ trợ đến BQT'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: LỊCH SỬ PHIẾU HỖ TRỢ                             */
          /* ========================================================= */
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0 0 4px 4px',
              border: '1px solid #e8e8e8',
              borderTop: 'none',
              padding: 24,
              marginBottom: 20,
            }}
          >
            {/* Filter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              {/* Search box */}
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã phiếu, tiêu đề, hoặc nội dung..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Status Select */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontSize: 13,
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ tiếp nhận</option>
                  <option value="IN_REVIEW">Đang giải quyết</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>

              {/* Type Select */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontSize: 13,
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">Tất cả phân loại</option>
                  <option value="INQUIRY">Thắc mắc vận hành</option>
                  <option value="COMPLAINT">Khiếu nại kiểm duyệt/đơn</option>
                  <option value="SUGGESTION">Đề xuất cải tiến</option>
                  <option value="SYSTEM_BUG">Báo lỗi hệ thống</option>
                  <option value="OTHER">Ý kiến khác</option>
                </select>
              </div>
            </div>

            {/* Table / List */}
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13 }}>Đang tải lịch sử phiếu khiếu nại & hỗ trợ...</div>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', margin: '0 0 6px' }}>
                  Không tìm thấy phiếu hỗ trợ nào phù hợp
                </p>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px' }}>
                  Quý nhà bán có thể chuyển sang tab &quot;Gửi phiếu hỗ trợ mới&quot; để gửi yêu cầu đến Ban Quản Trị.
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange('create')}
                  style={{
                    backgroundColor: '#facc15',
                    border: 'none',
                    color: '#0f172a',
                    padding: '7px 16px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Tạo phiếu hỗ trợ ngay
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e8e8e8', backgroundColor: '#fafafa', color: '#595959', fontSize: 12.5, fontWeight: 600 }}>
                      <th style={{ padding: '12px 14px' }}>Mã phiếu</th>
                      <th style={{ padding: '12px 14px' }}>Phân loại</th>
                      <th style={{ padding: '12px 14px' }}>Tiêu đề & Nội dung</th>
                      <th style={{ padding: '12px 14px' }}>Minh chứng</th>
                      <th style={{ padding: '12px 14px' }}>Thời gian gửi</th>
                      <th style={{ padding: '12px 14px' }}>Trạng thái</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedbacks.map((item) => {
                      const typeInfo = getTypeLabel(item.type)
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <td style={{ padding: '14px', fontWeight: 700, color: '#1e293b' }}>
                            {item.id}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
                              {typeInfo.icon}
                              <span>{typeInfo.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px', maxWidth: 300 }}>
                            <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.subject}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                              {item.content}
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt="Minh chứng"
                                style={{ width: 36, height: 28, objectFit: 'cover', borderRadius: 3, border: '1px solid #cbd5e1' }}
                                onError={(e) => {
                                  ;(e.target as any).style.display = 'none'
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>Không</span>
                            )}
                          </td>
                          <td style={{ padding: '14px', fontSize: 12, color: '#64748b' }}>
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: '14px' }}>
                            {getStatusBadge(item.status)}
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setViewingFeedback(item)}
                              style={{
                                backgroundColor: '#fefce8',
                                border: '1px solid #fef08a',
                                color: '#854d0e',
                                padding: '5px 12px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span>Xem phản hồi</span>
                              <ChevronRight size={12} />
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

        {/* ── Modal Xem Chi Tiết Phản Hồi BQT ── */}
        {viewingFeedback && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(2px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setViewingFeedback(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                width: '100%',
                maxWidth: 600,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e8e8e8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#fafafa',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                    Phiếu Khiếu Nại & Hỗ Trợ [{viewingFeedback.id}]
                  </div>
                  <div style={{ marginTop: 4 }}>{getStatusBadge(viewingFeedback.status)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingFeedback(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748b', cursor: 'pointer', padding: 4 }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Tiêu đề:
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {viewingFeedback.subject}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Nội dung đã gửi:
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#334155',
                      padding: '12px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    {viewingFeedback.content}
                  </div>
                </div>

                {viewingFeedback.imageUrl && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      Ảnh minh chứng:
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <img
                        src={viewingFeedback.imageUrl}
                        alt="Minh chứng đính kèm"
                        style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 6, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                )}

                {/* Phản Hồi Từ Ban Quản Trị */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 6,
                    backgroundColor: viewingFeedback.adminResponse ? '#f0fdf4' : '#fefce8',
                    border: `1px solid ${viewingFeedback.adminResponse ? '#bbf7d0' : '#fef08a'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MessageSquare size={15} color={viewingFeedback.adminResponse ? '#16a34a' : '#ca8a04'} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: viewingFeedback.adminResponse ? '#166534' : '#854d0e',
                      }}
                    >
                      {viewingFeedback.adminResponse ? 'Phản Hồi Từ Ban Quản Trị Sàn' : 'Đang Chờ BQT Phản Hồi'}
                    </span>
                  </div>

                  {viewingFeedback.adminResponse ? (
                    <div>
                      <div style={{ fontSize: 13.5, color: '#14532d', lineHeight: 1.6 }}>
                        {viewingFeedback.adminResponse}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#15803d', marginTop: 8 }}>
                        Người phụ trách: <strong>{viewingFeedback.resolvedBy || 'Ban Quản trị WebChicKen'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: '#78350f' }}>
                      Phiếu hỗ trợ đang trong hàng đợi xử lý. Quản trị viên sẽ sớm kiểm tra và cập nhật câu trả lời tại đây.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#fafafa',
                  borderTop: '1px solid #e8e8e8',
                  textAlign: 'right',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewingFeedback(null)}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#595959',
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

export default SellerFeedbackPage
