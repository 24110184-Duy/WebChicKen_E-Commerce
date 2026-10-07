import React, { useState, useEffect, useCallback } from 'react'
import {
  Percent,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Store,
  Calendar,
  RotateCcw,
  Zap,
  Power,
  Flame,
  ShieldCheck
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import type { AdminVoucherItem } from '../../features/admin/types/voucherTypes'
import {
  fetchAdminVouchers,
  triggerVoucherExpiryJob,
  toggleVoucherStatus
} from '../../features/admin/api/adminVoucherApi'

export const AdminVouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<AdminVoucherItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [triggeringJob, setTriggeringJob] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'AMOUNT' | 'PERCENTAGE'>('ALL')

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadVouchers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdminVouchers()
      setVouchers(data)
    } catch (err: any) {
      console.error('Lỗi tải danh sách voucher:', err)
      showToast('Không thể tải danh sách voucher.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVouchers()
  }, [loadVouchers])

  // Chạy Background Worker quét voucher hết hạn (TASK-70)
  const handleTriggerExpiryWorker = async () => {
    try {
      setTriggeringJob(true)
      const result = await triggerVoucherExpiryJob(true)
      await loadVouchers()
      if (result.deactivatedCount > 0) {
        showToast(
          `VoucherExpiryWorker: Đã vô hiệu hóa thành công ${result.deactivatedCount} voucher đã hết hạn hoặc hết lượt dùng!`,
          'success'
        )
      } else {
        showToast('VoucherExpiryWorker: Toàn bộ voucher đang hợp lệ, không có mã nào cần vô hiệu hóa.', 'success')
      }
    } catch (err: any) {
      showToast('Lỗi khi kích hoạt tiến trình quét voucher: ' + err?.message, 'error')
    } finally {
      setTriggeringJob(false)
    }
  }

  const handleToggle = async (id: string, code: string) => {
    try {
      const updated = await toggleVoucherStatus(id)
      setVouchers((prev) => prev.map((v) => (v.id === id ? updated : v)))
      showToast(
        `Đã chuyển voucher [${code}] sang trạng thái ${updated.isActive ? 'HOẠT ĐỘNG' : 'VÔ HIỆU HÓA'}!`,
        'success'
      )
    } catch (err: any) {
      showToast('Không thể thay đổi trạng thái voucher: ' + err?.message, 'error')
    }
  }

  const nowTime = new Date().getTime()

  // Filtered list
  const filteredVouchers = vouchers.filter((v) => {
    if (statusFilter === 'ACTIVE' && !v.isActive) return false
    if (statusFilter === 'INACTIVE' && v.isActive) return false
    if (typeFilter !== 'ALL' && v.type !== typeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const matchCode = v.code.toLowerCase().includes(q)
      const matchTitle = v.title.toLowerCase().includes(q)
      const matchStore = (v.storeName || '').toLowerCase().includes(q)
      if (!matchCode && !matchTitle && !matchStore) return false
    }
    return true
  })

  // Bento stats
  const totalCount = vouchers.length
  const activeCount = vouchers.filter((v) => v.isActive).length
  const inactiveCount = vouchers.filter((v) => !v.isActive).length
  const expiredPendingCount = vouchers.filter((v) => v.isActive && (new Date(v.endDate).getTime() < nowTime || v.usedCount >= v.usageLimit)).length

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
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
                  justifyContent: 'center',
                  border: '1px solid #fde68a'
                }}
              >
                <Percent size={20} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Quản Lý Phiếu Giảm Giá & Vouchers Sàn
              </h1>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 6, marginBottom: 0 }}>
              Kiểm soát ngân sách khuyến mãi, tỷ lệ hấp thụ và vận hành Background Worker quét voucher quá hạn (TASK-70)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={loadVouchers}
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
              <span>Làm mới</span>
            </button>

            {/* Background Worker Trigger Button (TASK-70) */}
            <button
              type="button"
              disabled={triggeringJob}
              onClick={handleTriggerExpiryWorker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 20px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: triggeringJob ? 'not-allowed' : 'pointer',
                opacity: triggeringJob ? 0.75 : 1,
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
              }}
              title="Kích hoạt tức thì VoucherExpiryWorker quét toàn bộ voucher hết hạn hoặc hết lượt dùng"
            >
              <Zap size={15} />
              <span>{triggeringJob ? 'Đang chạy Worker...' : '⚡ Quét & Khóa Voucher Quá Hạn'}</span>
            </button>
          </div>
        </div>

        {/* Bento Stats Cards */}
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
              <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Tổng mã khuyến mại</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalCount}</div>
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
              <Tag size={20} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>Đang hoạt động</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#15803d', marginTop: 4 }}>{activeCount}</div>
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
                color: '#15803d'
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#991b1b' }}>Đã vô hiệu hóa</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#b91c1c', marginTop: 4 }}>{inactiveCount}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b91c1c'
              }}
            >
              <Power size={20} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
              borderRadius: 12,
              border: '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#9a3412' }}>Chờ Worker quét tắt</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#c2410c', marginTop: 4 }}>{expiredPendingCount}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c2410c'
              }}
            >
              <Flame size={20} />
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
                placeholder="Tìm mã voucher, tên chương trình, gian hàng..."
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

            {/* Status Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
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
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Đã tắt / Hết hạn</option>
              </select>
            </div>

            {/* Type Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Loại chiết khấu:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
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
                <option value="ALL">Tất cả loại</option>
                <option value="AMOUNT">Giảm số tiền cố định (VNĐ)</option>
                <option value="PERCENTAGE">Giảm theo tỷ lệ (%)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('ALL')
              setTypeFilter('ALL')
              showToast('Đã đặt lại bộ lọc', 'success')
            }}
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
              <div>Đang tải dữ liệu voucher sàn...</div>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <Percent size={48} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>
                Không tìm thấy voucher nào phù hợp
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
                    <th style={{ padding: '14px 16px' }}>Mã Voucher</th>
                    <th style={{ padding: '14px 16px' }}>Chi Tiết & Chiết Khấu</th>
                    <th style={{ padding: '14px 16px' }}>Áp Dụng Cho</th>
                    <th style={{ padding: '14px 16px' }}>Thời Gian Hiệu Lực</th>
                    <th style={{ padding: '14px 16px' }}>Tỷ Lệ Tiêu Dùng</th>
                    <th style={{ padding: '14px 16px' }}>Trạng Thái</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((item) => {
                    const isDateExpired = new Date(item.endDate).getTime() < nowTime
                    const isLimitReached = item.usedCount >= item.usageLimit
                    const usagePercent = Math.min(100, Math.round((item.usedCount / item.usageLimit) * 100))

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        {/* Code */}
                        <td style={{ padding: '14px 16px' }}>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 14,
                              fontWeight: 800,
                              color: '#1e40af',
                              backgroundColor: '#eff6ff',
                              padding: '4px 10px',
                              borderRadius: 6,
                              display: 'inline-block',
                              border: '1px dashed #bfdbfe'
                            }}
                          >
                            {item.code}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 6 }}>
                            {item.title}
                          </div>
                        </td>

                        {/* Discount value & min order */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>
                            {item.type === 'PERCENTAGE'
                              ? `Giảm ${item.discountValueMinor}% (Tối đa ${item.maxDiscountAmountMinor.toLocaleString('vi-VN')} ₫)`
                              : `Giảm ${item.discountValueMinor.toLocaleString('vi-VN')} ₫`}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Đơn tối thiểu: {item.minOrderValueMinor.toLocaleString('vi-VN')} ₫
                          </div>
                        </td>

                        {/* Store / Platform */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155' }}>
                            <Store size={14} color="#64748b" />
                            <span>{item.storeName || 'Toàn sàn WebChicKen'}</span>
                          </div>
                        </td>

                        {/* Validity period */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={13} color="#64748b" />
                            <span>Hết hạn: {new Date(item.endDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          {isDateExpired && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#b91c1c',
                                backgroundColor: '#fef2f2',
                                padding: '2px 6px',
                                borderRadius: 4,
                                marginTop: 4
                              }}
                            >
                              <Clock size={11} />
                              <span>Đã quá hạn</span>
                            </span>
                          )}
                        </td>

                        {/* Usage progress */}
                        <td style={{ padding: '14px 16px', minWidth: 140 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                            <span>{item.usedCount} / {item.usageLimit}</span>
                            <span style={{ fontWeight: 600 }}>{usagePercent}%</span>
                          </div>
                          <div style={{ width: '100%', height: 6, backgroundColor: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${usagePercent}%`,
                                height: '100%',
                                backgroundColor: isLimitReached ? '#ef4444' : '#10b981',
                                borderRadius: 9999
                              }}
                            />
                          </div>
                          {isLimitReached && (
                            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 3 }}>
                              Hết lượt sử dụng
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {item.isActive ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: 9999,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0'
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Đang hoạt động</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: 9999,
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca'
                              }}
                            >
                              <Power size={12} />
                              <span>Đã vô hiệu hóa</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleToggle(item.id, item.code)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: `1px solid ${item.isActive ? '#fca5a5' : '#86efac'}`,
                              backgroundColor: item.isActive ? '#fff1f2' : '#f0fdf4',
                              color: item.isActive ? '#be123c' : '#15803d'
                            }}
                          >
                            {item.isActive ? 'Tắt voucher' : 'Mở lại'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
              color: '#64748b'
            }}
          >
            <span>
              Hiển thị <strong>{filteredVouchers.length}</strong> / <strong>{totalCount}</strong> vouchers
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#059669" />
              <span>Background Worker quét tự động định kỳ mỗi 60 giây qua ScheduledExecutorService</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
