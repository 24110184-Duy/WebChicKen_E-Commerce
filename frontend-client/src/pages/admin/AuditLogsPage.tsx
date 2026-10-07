import React, { useState, useEffect, useCallback } from 'react'
import {
  ScrollText,
  ShieldCheck,
  RotateCcw,
  Search,
  Lock,
  Store,
  Eye,
  Calendar,
  Globe,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import type {
  AuditLogItem,
  AuditLogActionFilter,
  AuditLogTargetFilter
} from '../../features/admin/types'
import { fetchAuditLogs } from '../../features/admin/api/adminAuditApi'
import { AuditLogDetailModal } from '../../features/admin/components/AuditLogDetailModal'

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters & Pagination
  const [actionFilter, setActionFilter] = useState<AuditLogActionFilter>('ALL')
  const [targetFilter, setTargetFilter] = useState<AuditLogTargetFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(15)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  // Stats calculation
  const [stats, setStats] = useState({
    total: 0,
    products: 0,
    users: 0,
    sellers: 0
  })

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAuditLogs({
        page,
        size: pageSize,
        search: searchQuery,
        action: actionFilter,
        targetType: targetFilter
      })
      setLogs(data.items)
      setTotalPages(data.totalPages)
      setTotalCount(data.total)

      // Cập nhật thống kê khi ở trạng thái mặc định
      if (!searchQuery && actionFilter === 'ALL' && targetFilter === 'ALL') {
        const allItems = data.items
        setStats({
          total: data.total,
          products: allItems.filter((l) => l.action.includes('PRODUCT')).length,
          users: allItems.filter((l) => l.action.includes('USER')).length,
          sellers: allItems.filter((l) => l.action.includes('SELLER')).length
        })
      }
    } catch (err: any) {
      console.error('Lỗi khi tải nhật ký kiểm toán:', err)
      setError(err?.message || 'Không thể tải sổ nhật ký kiểm toán hệ thống.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchQuery, actionFilter, targetFilter])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  const handleResetFilters = () => {
    setActionFilter('ALL')
    setTargetFilter('ALL')
    setSearchQuery('')
    setPage(1)
    showToast('Đã làm mới và đặt lại toàn bộ bộ lọc', 'success')
  }

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'N/A'
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

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diffSec < 60) return 'Vừa xong'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`
    return `${Math.floor(diffSec / 86400)} ngày trước`
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
        return { label: 'Duyệt người bán', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' }
      case 'REJECT_SELLER':
        return { label: 'Từ chối người bán', bg: '#fff7ed', color: '#9a3412', border: '#ffedd5' }
      default:
        return { label: action, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' }
    }
  }

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 10000,
              backgroundColor: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 600
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706'
                }}
              >
                <ScrollText size={20} />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Sổ Nhật Ký Kiểm Toán (Audit Trail Ledger)
              </h1>
              <span
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <ShieldCheck size={12} color="#10b981" /> TAMPER-EVIDENT
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
              Ghi nhận và lưu vết vĩnh viễn (WORM) mọi thao tác nhạy cảm, phê duyệt và can thiệp bảo mật của Ban Quản Trị hệ thống WebChicKen.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => {
                loadAuditLogs()
                showToast('Đã làm mới dữ liệu nhật ký kiểm toán', 'success')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} /> Làm mới
            </button>
          </div>
        </div>

        {/* 2. Bento KPIs Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24
          }}
        >
          {/* Card 1: Tổng nhật ký */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Tổng Nhật Ký Đã Lưu</span>
              <div style={{ padding: 6, backgroundColor: '#f5f3ff', borderRadius: 8, color: '#7c3aed' }}>
                <ScrollText size={18} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              {totalCount || stats.total}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Lưu vết vĩnh viễn không thể xóa
            </div>
          </div>

          {/* Card 2: Kiểm duyệt sản phẩm */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Kiểm Duyệt Sản Phẩm</span>
              <div style={{ padding: 6, backgroundColor: '#ecfdf5', borderRadius: 8, color: '#059669' }}>
                <ShieldCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>
              {stats.products}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Duyệt mở bán & từ chối tiêu chuẩn
            </div>
          </div>

          {/* Card 3: An ninh tài khoản & Ban */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Khóa & Mở Tài Khoản</span>
              <div style={{ padding: 6, backgroundColor: '#fef2f2', borderRadius: 8, color: '#dc2626' }}>
                <Lock size={18} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626' }}>
              {stats.users}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Thu hồi quyền truy cập tức thì
            </div>
          </div>

          {/* Card 4: Thẩm định gian hàng */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Hồ Sơ Người Bán</span>
              <div style={{ padding: 6, backgroundColor: '#fffbeb', borderRadius: 8, color: '#d97706' }}>
                <Store size={18} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706' }}>
              {stats.sellers}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Phê duyệt đối tác chăn nuôi & bán buôn
            </div>
          </div>
        </div>

        {/* 3. Filter & Search Toolbar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            marginBottom: 20,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 260 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Tìm theo nội dung, mã đối tượng, email admin, IP..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Hành động:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as AuditLogActionFilter)
                setPage(1)
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                backgroundColor: '#ffffff',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="BAN_USER">Khóa tài khoản (BAN_USER)</option>
              <option value="UNBAN_USER">Mở khóa tài khoản (UNBAN_USER)</option>
              <option value="APPROVE_PRODUCT">Duyệt sản phẩm (APPROVE_PRODUCT)</option>
              <option value="REJECT_PRODUCT">Từ chối sản phẩm (REJECT_PRODUCT)</option>
              <option value="APPROVE_SELLER">Duyệt người bán (APPROVE_SELLER)</option>
              <option value="REJECT_SELLER">Từ chối người bán (REJECT_SELLER)</option>
            </select>
          </div>

          {/* Target Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Tài nguyên:</span>
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value as AuditLogTargetFilter)
                setPage(1)
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                backgroundColor: '#ffffff',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tất cả tài nguyên</option>
              <option value="USER">Người dùng (USER)</option>
              <option value="PRODUCT">Sản phẩm (PRODUCT)</option>
              <option value="SELLER_APPLICATION">Đơn người bán (SELLER_APPLICATION)</option>
              <option value="ORDER">Đơn hàng (ORDER)</option>
            </select>
          </div>

          {/* Reset button */}
          {(searchQuery || actionFilter !== 'ALL' || targetFilter !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <Filter size={13} /> Xóa bộ lọc
            </button>
          )}
        </div>

        {/* 4. Audit Log Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Đang tải sổ nhật ký kiểm toán...</div>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
              <button
                onClick={loadAuditLogs}
                style={{
                  marginTop: 12,
                  padding: '8px 16px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Thử lại
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              <ScrollText size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>Không tìm thấy bản ghi kiểm toán phù hợp</div>
              <p style={{ margin: '6px 0 0 0', fontSize: 13 }}>Hãy thử thay đổi điều kiện tìm kiếm hoặc xóa bộ lọc.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                      Thời Gian Ghi Nhận
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                      Quản Trị Viên
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                      Hành Động
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                      Tài Nguyên Tác Động
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>
                      Nội Dung Chi Tiết
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                      IP Mạng
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((item) => {
                    const badge = getActionBadge(item.action)
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Thời gian */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0f172a' }}>
                            <Calendar size={13} color="#64748b" />
                            <span>{formatDateTime(item.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {formatTimeAgo(item.createdAt)}
                          </div>
                        </td>

                        {/* Admin */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {item.adminName || 'Hệ Thống'}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {item.adminEmail || item.adminId}
                          </div>
                        </td>

                        {/* Hành động */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              display: 'inline-block'
                            }}
                          >
                            {badge.label}
                          </span>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', marginTop: 2 }}>
                            {item.action}
                          </div>
                        </td>

                        {/* Tài nguyên */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: '#334155' }}>
                            {item.targetType || 'N/A'}
                          </div>
                          {item.targetId && (
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', marginTop: 2 }}>
                              ID: {item.targetId}
                            </div>
                          )}
                        </td>

                        {/* Chi tiết */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div
                            style={{
                              color: '#334155',
                              lineHeight: 1.5,
                              maxWidth: 380,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {item.detail || 'Không có mô tả chi tiết'}
                          </div>
                        </td>

                        {/* IP Mạng */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                            <Globe size={12} color="#64748b" />
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155', fontWeight: 600 }}>
                              {item.ipAddress || '127.0.0.1'}
                            </span>
                          </div>
                        </td>

                        {/* Chi tiết modal button */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => {
                              setSelectedLog(item)
                              setIsDetailOpen(true)
                            }}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            title="Xem chi tiết bản ghi"
                          >
                            <Eye size={13} /> Chi tiết
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: 13,
                color: '#64748b'
              }}
            >
              <div>
                Hiển thị trang <strong>{page}</strong> trên tổng số <strong>{totalPages}</strong> trang ({totalCount} bản ghi)
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    color: page <= 1 ? '#94a3b8' : '#0f172a',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  Trang trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    color: page >= totalPages ? '#94a3b8' : '#0f172a',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Detail Modal */}
        <AuditLogDetailModal
          log={selectedLog}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedLog(null)
          }}
        />
      </div>
    </AdminLayout>
  )
}
