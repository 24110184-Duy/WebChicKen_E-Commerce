import React, { useState, useEffect, useMemo } from 'react'
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  AlertCircle,
  Award,
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { adminShopApi } from '../../features/admin/api/adminShopApi'
import type { SellerApplication, ApplicationFilterTab } from '../../features/admin/types'
import { ShopDetailModal } from '../../features/admin/components/ShopDetailModal'
import { RejectReasonModal } from '../../features/admin/components/RejectReasonModal'

export const SellersPage: React.FC = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<ApplicationFilterTab>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [selectedApp, setSelectedApp] = useState<SellerApplication | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [rejectingApp, setRejectingApp] = useState<SellerApplication | null>(null)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Load applications
  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const data = await adminShopApi.getApplications()
      setApplications(data)
    } catch (err) {
      console.error('Failed to load seller applications:', err)
      showToast('Không thể tải danh sách hồ sơ đăng ký.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = applications.length
    const pending = applications.filter((a) => a.status === 'PENDING').length
    const approved = applications.filter((a) => a.status === 'APPROVED').length
    const rejected = applications.filter((a) => a.status === 'REJECTED').length
    return { total, pending, approved, rejected }
  }, [applications])

  // Filtered & Searched List
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Tab filter
      if (activeTab !== 'ALL' && app.status !== activeTab) {
        return false
      }

      // 2. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = app.shopName.toLowerCase().includes(query)
        const matchOwner = app.ownerName?.toLowerCase().includes(query) ?? false
        const matchPhone = app.phone?.toLowerCase().includes(query) ?? false
        const matchTax = app.taxCode?.toLowerCase().includes(query) ?? false
        const matchCert = app.certificateType?.toLowerCase().includes(query) ?? false
        const matchLocation = app.farmLocation?.toLowerCase().includes(query) ?? false
        return matchName || matchOwner || matchPhone || matchTax || matchCert || matchLocation
      }

      return true
    })
  }, [applications, activeTab, searchQuery])

  // Handlers
  const handleOpenDetail = (app: SellerApplication) => {
    setSelectedApp(app)
    setIsDetailModalOpen(true)
  }

  const handleApprove = async (app: SellerApplication) => {
    setIsSubmitting(true)
    try {
      const updated = await adminShopApi.reviewApplication(app.id, { status: 'APPROVED' })
      setApplications((prev) => prev.map((item) => (item.id === app.id ? updated : item)))
      if (selectedApp?.id === app.id) {
        setSelectedApp(updated)
      }
      setIsDetailModalOpen(false)
      showToast(`Đã phê duyệt thành công gian hàng "${app.shopName}"!`)
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi phê duyệt.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenRejectModal = (app: SellerApplication) => {
    setRejectingApp(app)
    setIsRejectModalOpen(true)
  }

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingApp) return
    setIsSubmitting(true)
    try {
      const updated = await adminShopApi.reviewApplication(rejectingApp.id, {
        status: 'REJECTED',
        rejectionReason: reason,
      })
      setApplications((prev) => prev.map((item) => (item.id === rejectingApp.id ? updated : item)))
      if (selectedApp?.id === rejectingApp.id) {
        setSelectedApp(updated)
      }
      setIsRejectModalOpen(false)
      setIsDetailModalOpen(false)
      setRejectingApp(null)
      showToast(`Đã từ chối hồ sơ gian hàng "${rejectingApp.shopName}".`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi từ chối hồ sơ.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetData = () => {
    const fresh = adminShopApi.resetDemoData()
    setApplications(fresh)
    showToast('Đã khôi phục dữ liệu thẩm định mẫu về mặc định.')
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
              borderRadius: 10,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13.5,
              fontWeight: 600,
              animation: 'adminScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: '#34d399' }} />
            ) : (
              <AlertCircle style={{ width: 18, height: 18, color: '#f87171' }} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Header Bar */}
        <div className="admin-page-header">
          <div className="admin-page-title-group">
            <h1>
              <span>🏪 Thẩm Định & Phê Duyệt Gian Hàng (Shop Approvals)</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                }}
              >
                TASK-64
              </span>
            </h1>
            <p className="admin-page-subtitle">
              Kiểm tra chứng nhận VietGAP, an toàn thực phẩm, mã số thuế và phê duyệt gian hàng gia cầm mới gia nhập sàn WebChicKen.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            title="Khôi phục dữ liệu mẫu để thử nghiệm quy trình duyệt"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw style={{ width: 14, height: 14 }} />
            <span>Reset Dữ Liệu Demo</span>
          </button>
        </div>

        {/* 2. Macro KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* Card: Total */}
          <div className="admin-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Tổng Hồ Sơ
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Store style={{ width: 16, height: 16 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Đơn đăng ký mở shop</span>
          </div>

          {/* Card: Pending */}
          <div
            className="admin-card"
            style={{
              padding: 18,
              border: stats.pending > 0 ? '1.5px solid #fde68a' : undefined,
              backgroundColor: stats.pending > 0 ? '#fffdf7' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                Chờ Xét Duyệt
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock style={{ width: 16, height: 16 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{stats.pending}</span>
              {stats.pending > 0 && <span className="admin-pulse-dot" style={{ backgroundColor: '#d97706' }} />}
            </div>
            <span style={{ fontSize: 12, color: '#b45309' }}>Cần Admin xử lý ngay</span>
          </div>

          {/* Card: Approved */}
          <div className="admin-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                Đã Phê Duyệt
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 style={{ width: 16, height: 16 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>{stats.approved}</div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Đang bán hàng hoạt động</span>
          </div>

          {/* Card: Rejected */}
          <div className="admin-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                Đã Từ Chối
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle style={{ width: 16, height: 16 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626' }}>{stats.rejected}</div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Cần bổ sung hồ sơ</span>
          </div>
        </div>

        {/* 3. Filter & Search Bar */}
        <div
          className="admin-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                backgroundColor: activeTab === 'ALL' ? '#0f172a' : '#f1f5f9',
                color: activeTab === 'ALL' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Tất cả</span>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: activeTab === 'ALL' ? '#334155' : '#e2e8f0',
                  padding: '1px 6px',
                  borderRadius: 10,
                }}
              >
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                backgroundColor: activeTab === 'PENDING' ? '#d97706' : '#fffbeb',
                color: activeTab === 'PENDING' ? '#ffffff' : '#b45309',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Chờ xét duyệt</span>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: activeTab === 'PENDING' ? '#b45309' : '#fef3c7',
                  padding: '1px 6px',
                  borderRadius: 10,
                }}
              >
                {stats.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('APPROVED')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                backgroundColor: activeTab === 'APPROVED' ? '#059669' : '#ecfdf5',
                color: activeTab === 'APPROVED' ? '#ffffff' : '#059669',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Đã phê duyệt</span>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: activeTab === 'APPROVED' ? '#047857' : '#d1fae5',
                  padding: '1px 6px',
                  borderRadius: 10,
                }}
              >
                {stats.approved}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REJECTED')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                backgroundColor: activeTab === 'REJECTED' ? '#dc2626' : '#fef2f2',
                color: activeTab === 'REJECTED' ? '#ffffff' : '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Đã từ chối</span>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: activeTab === 'REJECTED' ? '#b91c1c' : '#fee2e2',
                  padding: '1px 6px',
                  borderRadius: 10,
                }}
              >
                {stats.rejected}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 280, flex: 1, maxWidth: 420 }}>
            <Search
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên shop, chủ hộ, địa chỉ, MST..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 4. Applications Data Table */}
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <div className="admin-pulse-dot" style={{ margin: '0 auto 12px', width: 14, height: 14 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Đang tải danh sách hồ sơ đăng ký gian hàng...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Store style={{ width: 44, height: 44, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                Không tìm thấy hồ sơ gian hàng nào
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                {searchQuery
                  ? `Không có kết quả nào phù hợp với từ khóa "${searchQuery}".`
                  : 'Chưa có hồ sơ đăng ký nào trong mục này.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 1120, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', fontSize: 12, minWidth: 280 }}>
                      GIAN HÀNG & CHỦ SỞ HỮU
                    </th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', fontSize: 12, minWidth: 200 }}>
                      MÔ HÌNH & ĐỊA ĐIỂM
                    </th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', fontSize: 12, minWidth: 230 }}>
                      CHỨNG NHẬN TIÊU CHUẨN
                    </th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', fontSize: 12, minWidth: 120, whiteSpace: 'nowrap' }}>
                      NGÀY NỘP ĐƠN
                    </th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', fontSize: 12, minWidth: 140, whiteSpace: 'nowrap' }}>
                      TRẠNG THÁI
                    </th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', fontSize: 12, minWidth: 260, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => {
                    const isPending = app.status === 'PENDING'
                    const isApproved = app.status === 'APPROVED'
                    const isRejected = app.status === 'REJECTED'

                    return (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                          backgroundColor: isPending ? '#fffdf7' : undefined,
                        }}
                      >
                        {/* Shop Name & Owner */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: 280 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: isPending ? '#fef3c7' : isApproved ? '#ecfdf5' : '#fef2f2',
                                color: isPending ? '#d97706' : isApproved ? '#059669' : '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 2,
                                border: isPending ? '1px solid #fde68a' : isApproved ? '1px solid #a7f3d0' : '1px solid #fecaca',
                              }}
                            >
                              <Store style={{ width: 20, height: 20 }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, lineHeight: 1.4 }}>
                                {app.shopName}
                              </div>
                              <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                                Đại diện: <strong>{app.ownerName || 'Chưa cập nhật'}</strong>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                                SĐT: {app.phone || '—'} • MST: {app.taxCode || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Farm type & location */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: 200 }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
                            {app.farmType || 'Gia cầm thương phẩm'}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                            {app.farmLocation || 'Đang cập nhật'}
                          </div>
                          {app.dailyCapacity && (
                            <div style={{ fontSize: 11.5, color: '#0284c7', marginTop: 2 }}>
                              Quy mô: {app.dailyCapacity}
                            </div>
                          )}
                        </td>

                        {/* Certificate */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: 230 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Award style={{ width: 14, height: 14, color: '#059669', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: '#059669' }}>
                              {app.certificateType || 'VietGAP'}
                            </span>
                          </div>
                          {app.certificateNumber && (
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                              Số hiệu: {app.certificateNumber}
                            </div>
                          )}
                          {app.certificateExpiry && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              Hạn đến: {app.certificateExpiry}
                            </div>
                          )}
                        </td>

                        {/* Submitted date */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'top', color: '#475569', fontSize: 12.5, whiteSpace: 'nowrap', minWidth: 120 }}>
                          <div style={{ fontWeight: 600 }}>{new Date(app.submittedAt).toLocaleDateString('vi-VN')}</div>
                          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                            {new Date(app.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'top', whiteSpace: 'nowrap', minWidth: 140 }}>
                          {isPending && (
                            <span
                              className="admin-status-badge pending"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '5px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span className="admin-pulse-dot" style={{ backgroundColor: '#d97706', width: 7, height: 7, borderRadius: '50%' }} />
                              Chờ duyệt
                            </span>
                          )}
                          {isApproved && (
                            <span
                              className="admin-status-badge approved"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '5px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <CheckCircle2 style={{ width: 14, height: 14, color: '#059669' }} />
                              Đã duyệt
                            </span>
                          )}
                          {isRejected && (
                            <span
                              className="admin-status-badge rejected"
                              title={app.rejectionReason}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '5px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <XCircle style={{ width: 14, height: 14, color: '#dc2626' }} />
                              Đã từ chối
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 260 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'nowrap' }}>
                            {/* View Detail button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(app)}
                              title="Xem chi tiết hồ sơ thẩm định"
                              style={{
                                height: 32,
                                padding: '0 12px',
                                borderRadius: 8,
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#334155',
                                fontSize: 12.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Eye style={{ width: 14, height: 14 }} />
                              <span>Hồ sơ</span>
                            </button>

                            {/* Quick Action buttons if PENDING */}
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(app)}
                                  disabled={isSubmitting}
                                  title="Phê duyệt nhanh gian hàng"
                                  style={{
                                    height: 32,
                                    padding: '0 12px',
                                    borderRadius: 8,
                                    border: 'none',
                                    backgroundColor: '#10b981',
                                    color: '#ffffff',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 5,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.25)',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <CheckCircle2 style={{ width: 14, height: 14 }} />
                                  <span>Duyệt</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(app)}
                                  disabled={isSubmitting}
                                  title="Từ chối hồ sơ này"
                                  style={{
                                    height: 32,
                                    padding: '0 12px',
                                    borderRadius: 8,
                                    border: '1px solid #fecaca',
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 5,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <XCircle style={{ width: 14, height: 14 }} />
                                  <span>Từ chối</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Inspection Modal */}
      <ShopDetailModal
        application={selectedApp}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleOpenRejectModal}
        isSubmitting={isSubmitting}
      />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={isRejectModalOpen}
        shopName={rejectingApp?.shopName || ''}
        onClose={() => {
          setIsRejectModalOpen(false)
          setRejectingApp(null)
        }}
        onConfirm={handleConfirmReject}
        isSubmitting={isSubmitting}
      />
    </AdminLayout>
  )
}
