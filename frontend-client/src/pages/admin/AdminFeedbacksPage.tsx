import React, { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Check,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  Bug,
  FileText
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

export const AdminFeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters & Pagination
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

  const handleResetFilters = () => {
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
    const updated = await respondToFeedback(id, {
      status: newStatus,
      adminResponse
    })
    setFeedbacks((prev) => prev.map((f) => (f.id === id ? updated : f)))
    showToast(`Đã lưu và phản hồi phiếu khiếu nại [${id}] thành công!`, 'success')
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a'
            }}
          >
            <Clock size={12} />
            <span>Chờ xử lý</span>
          </span>
        )
      case 'IN_REVIEW':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe'
            }}
          >
            <RefreshCw size={12} className="spin-slow" />
            <span>Đang xem xét</span>
          </span>
        )
      case 'RESOLVED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
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
              gap: 5,
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
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

  const getTypeBadge = (type: FeedbackType) => {
    switch (type) {
      case 'COMPLAINT':
        return { label: 'Khiếu nại', icon: <ShieldAlert size={13} color="#dc2626" />, bg: '#fee2e2', color: '#991b1b' }
      case 'INQUIRY':
        return { label: 'Thắc mắc', icon: <HelpCircle size={13} color="#2563eb" />, bg: '#dbeafe', color: '#1e40af' }
      case 'SUGGESTION':
        return { label: 'Đề xuất', icon: <Lightbulb size={13} color="#059669" />, bg: '#ecfdf5', color: '#065f46' }
      case 'SYSTEM_BUG':
        return { label: 'Báo lỗi hệ thống', icon: <Bug size={13} color="#d97706" />, bg: '#fef3c7', color: '#92400e' }
      default:
        return { label: 'Khác', icon: <FileText size={13} color="#475569" />, bg: '#f1f5f9', color: '#475569' }
    }
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Toast */}
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
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #bfdbfe'
                }}
              >
                <MessageSquare size={20} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Hòm Thư Phản Hồi & Khiếu Nại Nhà Bán
              </h1>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 6, marginBottom: 0 }}>
              Tiếp nhận, xử lý khiếu nại và phản hồi trực tiếp cho các nhà bán hàng / chủ trang trại trên sàn
            </p>
          </div>

          <button
            type="button"
            onClick={loadFeedbacks}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 13,
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Làm mới danh sách</span>
          </button>
        </div>

        {/* Bento Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 16,
            marginBottom: 24
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
              <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Tổng phản hồi sàn</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{stats.total || feedbacks.length}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
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
              <div style={{ fontSize: 13, fontWeight: 500, color: '#92400e' }}>Chờ tiếp nhận xử lý</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                {feedbacks.filter((f) => f.status === 'PENDING').length}
              </div>
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
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                {feedbacks.filter((f) => f.status === 'IN_REVIEW').length}
              </div>
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
              <div style={{ fontSize: 13, fontWeight: 500, color: '#065f46' }}>Đã hoàn tất giải quyết</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {feedbacks.filter((f) => f.status === 'RESOLVED').length}
              </div>
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

        {/* Filter Controls Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 280, flex: 1 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã phiếu, nông trại, email, tiêu đề..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
            </div>

            {/* Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#334155'
                }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý (Pending)</option>
                <option value="IN_REVIEW">Đang giải quyết (In Review)</option>
                <option value="RESOLVED">Đã giải quyết (Resolved)</option>
                <option value="REJECTED">Từ chối (Rejected)</option>
              </select>
            </div>

            {/* Type Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Phân loại:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
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
              padding: '8px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 13,
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RotateCcw size={14} />
            <span>Đặt lại</span>
          </button>
        </div>

        {/* Data Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
              <div>Đang tải danh sách khiếu nại từ nhà bán...</div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>
                Không tìm thấy khiếu nại hoặc phản hồi nào phù hợp
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>
                Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: 12.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    <th style={{ padding: '14px 16px' }}>Mã phiếu</th>
                    <th style={{ padding: '14px 16px' }}>Nhà bán / Nông trại</th>
                    <th style={{ padding: '14px 16px' }}>Phân loại</th>
                    <th style={{ padding: '14px 16px' }}>Chủ đề & Nội dung</th>
                    <th style={{ padding: '14px 16px' }}>Minh chứng</th>
                    <th style={{ padding: '14px 16px' }}>Thời gian gửi</th>
                    <th style={{ padding: '14px 16px' }}>Trạng thái</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((item) => {
                    const typeBadge = getTypeBadge(item.type)
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                          {item.id}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                            {item.shopName || 'Hộ kinh doanh mới'}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {item.userEmail || item.userId}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: 6,
                              backgroundColor: typeBadge.bg,
                              color: typeBadge.color
                            }}
                          >
                            {typeBadge.icon}
                            <span>{typeBadge.label}</span>
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: 360 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.subject}
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: '#475569',
                              marginTop: 2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.content}
                          </div>
                          {item.adminResponse && (
                            <div
                              style={{
                                fontSize: 11.5,
                                color: '#15803d',
                                marginTop: 4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Check size={12} />
                              <span>Đã phản hồi: {item.adminResponse.slice(0, 50)}...</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {item.imageUrl ? (
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: 6,
                                backgroundColor: '#eff6ff'
                              }}
                            >
                              <ImageIcon size={13} />
                              <span>Xem ảnh</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Không có</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#64748b' }}>
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {getStatusBadge(item.status)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenRespond(item)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
                            }}
                          >
                            <Eye size={13} />
                            <span>Xem & Xử Lý</span>
                          </button>
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
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Hiển thị <strong>{feedbacks.length}</strong> / <strong>{totalCount}</strong> khiếu nại
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 12.5,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1
                }}
              >
                Trang trước
              </button>
              <span style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 12.5,
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
      </div>
    </AdminLayout>
  )
}
