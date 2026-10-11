import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MessageSquare,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  Bug,
  FileText,
  ImageOff,
  Copy
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import type {
  FeedbackItem,
  FeedbackStatus,
  FeedbackType
} from '../../features/shop/types/feedbackTypes'
import {
  fetchAdminFeedbacks,
  respondToFeedback
} from '../../features/shop/api/feedbackApi'
import { RespondFeedbackModal } from '../../features/admin/components/RespondFeedbackModal'
import { ImageLightboxModal } from '../../components/feedback/ImageLightboxModal'

export const AdminFeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters & Pagination
  const [senderFilter, setSenderFilter] = useState<'ALL' | 'CUSTOMER' | 'SELLER'>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(15)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Modal State
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // Lightbox Preview State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean
    imageUrl: string | null
    title: string
  }>({
    isOpen: false,
    imageUrl: null,
    title: ''
  })

  // Summary Metrics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
    rejected: 0
  })

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    showToast(`Đã sao chép mã phiếu: ${id.slice(0, 8)}...`, 'success')
  }

  const loadFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdminFeedbacks({
        page,
        size: pageSize,
        status: statusFilter,
        type: typeFilter,
        search: searchQuery
      })
      setFeedbacks(data.items)
      setTotalPages(data.totalPages)
      setTotalCount(data.total)

      // Cập nhật stats khi ở bộ lọc toàn bộ
      if (statusFilter === 'ALL' && typeFilter === 'ALL' && !searchQuery) {
        const all = data.items
        setStats({
          total: data.total,
          pending: all.filter((f) => f.status === 'PENDING').length,
          inReview: all.filter((f) => f.status === 'IN_REVIEW').length,
          resolved: all.filter((f) => f.status === 'RESOLVED').length,
          rejected: all.filter((f) => f.status === 'REJECTED').length
        })
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách phản hồi admin:', err)
      showToast('Không thể tải danh sách phản hồi từ máy chủ.', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, typeFilter, searchQuery])

  useEffect(() => {
    loadFeedbacks()
  }, [loadFeedbacks])

  const displayedFeedbacks = useMemo(() => {
    const filtered = feedbacks.filter((item) => {
      if (senderFilter === 'CUSTOMER') {
        const isCustomer = item.senderRole === 'CUSTOMER' || !item.shopName
        if (!isCustomer) return false
      } else if (senderFilter === 'SELLER') {
        const isSeller = item.senderRole === 'SELLER' || Boolean(item.shopName)
        if (!isSeller) return false
      }
      return true
    })

    return [...filtered].sort((a, b) => {
      const aPending = a.status === 'PENDING'
      const bPending = b.status === 'PENDING'
      // 1. Ưu tiên PENDING lên đầu danh sách
      if (aPending && !bPending) return -1
      if (!aPending && bPending) return 1

      // 2. Đối với PENDING: sort theo ngày cũ nhất lên đầu (FIFO - cũ nhất xử lý trước)
      if (aPending && bPending) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }

      // 3. Đối với các trạng thái khác: sort theo ngày mới nhất lên đầu
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [feedbacks, senderFilter])

  const handleResetFilters = () => {
    setSenderFilter('ALL')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    setSearchQuery('')
    setPage(1)
    showToast('Đã đặt lại bộ lọc', 'success')
  }

  const handleOpenRespond = (item: FeedbackItem) => {
    setSelectedFeedback(item)
    setIsModalOpen(true)
  }

  const handleSaveResponse = async (id: string, newStatus: FeedbackStatus, adminResponse: string) => {
    await respondToFeedback(id, {
      status: newStatus,
      adminResponse
    })
    showToast(`Đã xử lý phiếu khiếu nại [${id.slice(0, 8)}] thành công!`, 'success')
    await loadFeedbacks()
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={11} />
            <span>Chờ xử lý</span>
          </span>
        )
      case 'IN_REVIEW':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={11} className="spin-slow" />
            <span>Đang xử lý</span>
          </span>
        )
      case 'RESOLVED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              whiteSpace: 'nowrap'
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
              padding: '2px 7px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              whiteSpace: 'nowrap'
            }}
          >
            <AlertCircle size={11} />
            <span>Từ chối</span>
          </span>
        )
      default:
        return <span style={{ fontSize: 11 }}>{status}</span>
    }
  }

  const getTypeBadge = (type: FeedbackType) => {
    switch (type) {
      case 'COMPLAINT':
        return { label: 'Khiếu nại', icon: <ShieldAlert size={11} color="#dc2626" />, bg: '#fee2e2', color: '#991b1b' }
      case 'INQUIRY':
        return { label: 'Thắc mắc', icon: <HelpCircle size={11} color="#2563eb" />, bg: '#dbeafe', color: '#1e40af' }
      case 'SUGGESTION':
        return { label: 'Đề xuất', icon: <Lightbulb size={11} color="#059669" />, bg: '#ecfdf5', color: '#065f46' }
      case 'SYSTEM_BUG':
        return { label: 'Báo lỗi hệ thống', icon: <Bug size={11} color="#d97706" />, bg: '#fef3c7', color: '#92400e' }
      default:
        return { label: 'Khác', icon: <FileText size={11} color="#475569" />, bg: '#f1f5f9', color: '#475569' }
    }
  }

  return (
    <AdminLayout>
      <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Toast */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '10px 16px',
              borderRadius: 8,
              backgroundColor: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
              color: '#ffffff',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 500
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #bfdbfe'
                }}
              >
                <MessageSquare size={16} />
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Hòm Thư Phản Hồi & Khiếu Nại (User Feedback)
              </h1>
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
              Tiếp nhận, xử lý khiếu nại và phản hồi trực tiếp cho khách hàng & nhà bán hàng trên sàn
            </p>
          </div>

          <button
            type="button"
            onClick={loadFeedbacks}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 12,
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Bento Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 14
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>Tổng phản hồi sàn</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{stats.total || feedbacks.length}</div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
            >
              <FileText size={18} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid #fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#92400e' }}>Chờ tiếp nhận xử lý</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309', marginTop: 2 }}>
                {feedbacks.filter((f) => f.status === 'PENDING').length}
              </div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706'
              }}
            >
              <Clock size={18} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1e40af' }}>Đang giải quyết</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                {feedbacks.filter((f) => f.status === 'IN_REVIEW').length}
              </div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
            >
              <RefreshCw size={18} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid #d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#065f46' }}>Đã hoàn tất giải quyết</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                {feedbacks.filter((f) => f.status === 'RESOLVED').length}
              </div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 220, flex: 1 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã phiếu, nông trại, email, tiêu đề..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 9 }} />
            </div>

            {/* Sender Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Đối tượng:</label>
              <select
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value as any)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#334155'
                }}
              >
                <option value="ALL">Tất cả đối tượng</option>
                <option value="CUSTOMER">👤 Khách hàng</option>
                <option value="SELLER">🏪 Người bán</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#334155'
                }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="IN_REVIEW">Đang giải quyết</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>

            {/* Type Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Phân loại:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#334155'
                }}
              >
                <option value="ALL">Tất cả loại yêu cầu</option>
                <option value="COMPLAINT">Khiếu nại</option>
                <option value="INQUIRY">Thắc mắc vận hành</option>
                <option value="SUGGESTION">Đề xuất cải tiến</option>
                <option value="SYSTEM_BUG">Báo lỗi hệ thống</option>
                <option value="OTHER">Ý kiến khác</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 12,
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RotateCcw size={13} />
            <span>Đặt lại</span>
          </button>
        </div>

        {/* Data Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            width: '100%'
          }}
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
              <div>Đang tải danh sách khiếu nại từ nhà bán...</div>
            </div>
          ) : displayedFeedbacks.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>
                Không tìm thấy khiếu nại hoặc phản hồi nào phù hợp
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>
                Thử điều chỉnh lại bộ lọc đối tượng, trạng thái hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    <th style={{ padding: '9px 6px', width: '10%', boxSizing: 'border-box' }}>Mã phiếu</th>
                    <th style={{ padding: '9px 6px', width: '16%', boxSizing: 'border-box' }}>Người gửi / Đối tượng</th>
                    <th style={{ padding: '9px 6px', width: '11%', boxSizing: 'border-box' }}>Phân loại</th>
                    <th style={{ padding: '9px 6px', width: '28%', boxSizing: 'border-box' }}>Chủ đề & Nội dung</th>
                    <th style={{ padding: '9px 6px', width: '9%', boxSizing: 'border-box' }}>Minh chứng</th>
                    <th style={{ padding: '9px 6px', width: '9%', boxSizing: 'border-box' }}>Thời gian gửi</th>
                    <th style={{ padding: '9px 6px', width: '10%', boxSizing: 'border-box' }}>Trạng thái</th>
                    <th style={{ padding: '9px 6px', width: '7%', textAlign: 'right', boxSizing: 'border-box' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedFeedbacks.map((item: FeedbackItem) => {
                    const typeBadge = getTypeBadge(item.type)
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '7px 6px', verticalAlign: 'middle', boxSizing: 'border-box' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <span
                              title={`Mã phiếu đầy đủ: ${item.id}\nNhấp để sao chép`}
                              style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: '#334155',
                                backgroundColor: '#f1f5f9',
                                padding: '2px 4px',
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                letterSpacing: '-0.02em',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              #{item.id.slice(0, 8)}
                            </span>
                            <button
                              type="button"
                              title="Sao chép toàn bộ mã phiếu"
                              onClick={(e) => handleCopyId(item.id, e)}
                              style={{
                                padding: '2px 3px',
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#ffffff',
                                color: '#64748b',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#2563eb'
                                e.currentTarget.style.borderColor = '#93c5fd'
                                e.currentTarget.style.backgroundColor = '#eff6ff'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#64748b'
                                e.currentTarget.style.borderColor = '#e2e8f0'
                                e.currentTarget.style.backgroundColor = '#ffffff'
                              }}
                            >
                              <Copy size={10} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '7px 6px', verticalAlign: 'middle', overflow: 'hidden', boxSizing: 'border-box' }}>
                          {item.senderRole === 'SELLER' || item.shopName ? (
                            <div style={{ overflow: 'hidden' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  padding: '1px 4px',
                                  borderRadius: 3,
                                  backgroundColor: '#f5f3ff',
                                  color: '#7c3aed',
                                  marginBottom: 1
                                }}
                              >
                                🏪 Người bán
                              </span>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={item.shopName || 'Gian hàng đối tác'}
                              >
                                {item.shopName || 'Gian hàng đối tác'}
                              </div>
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: '#64748b',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={item.userEmail || item.userId}
                              >
                                {item.userEmail || item.userId}
                              </div>
                            </div>
                          ) : (
                            <div style={{ overflow: 'hidden' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  padding: '1px 4px',
                                  borderRadius: 3,
                                  backgroundColor: '#ecfdf5',
                                  color: '#059669',
                                  marginBottom: 1
                                }}
                              >
                                👤 Khách hàng
                              </span>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={item.senderName || 'Người mua hàng'}
                              >
                                {item.senderName || 'Người mua hàng'}
                              </div>
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: '#64748b',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={item.userEmail || item.userId}
                              >
                                {item.userEmail || item.userId}
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '7px 6px', verticalAlign: 'middle', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: '2px 5px',
                              borderRadius: 4,
                              backgroundColor: typeBadge.bg,
                              color: typeBadge.color,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {typeBadge.icon}
                            <span>{typeBadge.label}</span>
                          </span>
                        </td>
                        <td style={{ padding: '7px 6px', verticalAlign: 'middle', overflow: 'hidden', boxSizing: 'border-box' }}>
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={item.subject}
                          >
                            {item.subject}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: '#475569',
                              marginTop: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={item.content}
                          >
                            {item.content}
                          </div>
                          {item.adminResponse && (
                            <div
                              style={{
                                fontSize: 10,
                                color: '#15803d',
                                marginTop: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={`Đã phản hồi: ${item.adminResponse}`}
                            >
                              <Check size={10} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Đã phản hồi: {item.adminResponse}
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '7px 6px', verticalAlign: 'middle', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                          {item.imageUrl ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <div
                                onClick={() =>
                                  setLightboxState({
                                    isOpen: true,
                                    imageUrl: item.imageUrl!,
                                    title: `Minh chứng phiếu #${item.id.slice(0, 8)} - ${item.subject}`
                                  })
                                }
                                title="Nhấp để xem ảnh"
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  backgroundColor: '#f8fafc'
                                }}
                              >
                                <img
                                  src={item.imageUrl}
                                  alt="Minh chứng"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    ;(e.target as HTMLElement).style.display = 'none'
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxState({
                                    isOpen: true,
                                    imageUrl: item.imageUrl!,
                                    title: `Minh chứng phiếu #${item.id.slice(0, 8)} - ${item.subject}`
                                  })
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  padding: '2px 5px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: '#1d4ed8',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Eye size={10} />
                                <span>Xem</span>
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                padding: '1px 4px',
                                borderRadius: 3,
                                fontSize: 10,
                                color: '#94a3b8',
                                backgroundColor: '#f8fafc',
                                border: '1px dashed #cbd5e1'
                              }}
                            >
                              <ImageOff size={9} />
                              <span>Không</span>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '7px 6px', verticalAlign: 'middle', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td style={{ padding: '7px 6px', verticalAlign: 'middle', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                          {getStatusBadge(item.status)}
                        </td>
                        <td style={{ padding: '7px 6px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                          {item.status !== 'PENDING' || Boolean(item.adminResponse) ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRespond(item)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: 5,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                              }}
                              title="Xem chi tiết kết quả xử lý"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e2e8f0'
                                e.currentTarget.style.borderColor = '#94a3b8'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8fafc'
                                e.currentTarget.style.borderColor = '#cbd5e1'
                              }}
                            >
                              <Eye size={11} />
                              <span>Xem</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRespond(item)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 5,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                              }}
                              title="Xử lý phản hồi"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1d4ed8'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563eb'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              <Eye size={11} />
                              <span>Xử lý</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer Pagination */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Hiển thị <strong>{feedbacks.length}</strong> / <strong>{totalCount}</strong> khiếu nại
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 12,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1
                }}
              >
                Trang trước
              </button>
              <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 12,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1
                }}
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>

        {/* Modal Xử lý & Phản hồi */}
        <RespondFeedbackModal
          isOpen={isModalOpen}
          feedback={selectedFeedback}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveResponse}
        />

        {/* Modal Lightbox Xem Toàn Màn Hình Minh Chứng */}
        <ImageLightboxModal
          isOpen={lightboxState.isOpen}
          imageUrl={lightboxState.imageUrl}
          title={lightboxState.title}
          onClose={() => setLightboxState({ isOpen: false, imageUrl: null, title: '' })}
        />
      </div>
    </AdminLayout>
  )
}
