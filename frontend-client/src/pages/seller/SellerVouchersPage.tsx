import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Tag,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Power,
  Trash2,
  X,
  AlertTriangle,
  Store,
  FolderTree,
  Sparkles,
  Clock
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import { sellerApi } from '../../features/seller/api/sellerApi'
import { sellerVoucherApi } from '../../features/seller/api/sellerVoucherApi'
import { adminCategoryApi, type CategoryItem } from '../../features/admin/api/adminCategoryApi'
import type { AdminVoucherItem, CreateVoucherPayload, VoucherType } from '../../features/admin/types/voucherTypes'
import { formatMoney } from '../../shared/lib/formatMoney'

export const SellerVouchersPage: React.FC = () => {
  const [storeId, setStoreId] = useState<string>('')
  const [storeName, setStoreName] = useState<string>('')
  const [vouchers, setVouchers] = useState<AdminVoucherItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'EXPIRED'>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERCENTAGE' | 'AMOUNT'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [creating, setCreating] = useState<boolean>(false)
  const [formScope, setFormScope] = useState<'STORE_WIDE' | 'CATEGORY'>('STORE_WIDE')
  const [formCode, setFormCode] = useState<string>('')
  const [formTitle, setFormTitle] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [formType, setFormType] = useState<VoucherType>('AMOUNT')
  const [formDiscountValue, setFormDiscountValue] = useState<string>('20000')
  const [formMinOrderValue, setFormMinOrderValue] = useState<string>('100000')
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('50000')
  const [formCategoryId, setFormCategoryId] = useState<string>('')
  const [formUsageLimit, setFormUsageLimit] = useState<string>('100')
  const [formStartDate, setFormStartDate] = useState<string>('')
  const [formEndDate, setFormEndDate] = useState<string>('')

  // Delete Modal
  const [deletingVoucher, setDeletingVoucher] = useState<AdminVoucherItem | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load store information & categories
  useEffect(() => {
    const initData = async () => {
      try {
        const [store, cats] = await Promise.allSettled([
          sellerApi.getMyStore(),
          adminCategoryApi.getCategories()
        ])

        if (store.status === 'fulfilled' && store.value) {
          setStoreId(store.value.id)
          setStoreName(store.value.storeName)
        }

        if (cats.status === 'fulfilled') {
          setCategories(cats.value)
        }
      } catch (err) {
        console.error('Lỗi khởi tạo thông tin người bán:', err)
      }
    }
    initData()
  }, [])

  // Load vouchers of this store
  const loadVouchers = useCallback(async () => {
    if (!storeId) return
    try {
      setLoading(true)
      const data = await sellerVoucherApi.fetchSellerVouchers(storeId)
      setVouchers(data)
    } catch (err: any) {
      console.error('Lỗi tải danh sách voucher:', err)
      showToast('Không thể tải danh sách voucher của gian hàng.', 'error')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    if (storeId) {
      loadVouchers()
    }
  }, [storeId, loadVouchers])

  // Category map helper
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => {
      map[c.id] = c.name
    })
    return map
  }, [categories])

  // Generate random voucher code
  const generateRandomCode = () => {
    const prefix = (storeName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'SHOP').toUpperCase()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    setFormCode(`${prefix}${rand}`)
  }

  // Set default dates for create modal
  const openCreateModal = () => {
    const now = new Date()
    const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

    setFormStartDate(nowStr)
    setFormEndDate(endStr)
    setFormScope('STORE_WIDE')
    setFormCategoryId(categories[0]?.id || '')
    generateRandomCode()
    setIsCreateModalOpen(true)
  }

  // Handle Create Voucher
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) {
      showToast('Không xác định được gian hàng của bạn.', 'error')
      return
    }

    if (!formCode.trim()) {
      showToast('Vui lòng nhập mã voucher.', 'error')
      return
    }
    if (!formTitle.trim()) {
      showToast('Vui lòng nhập tên chương trình voucher.', 'error')
      return
    }

    const discountVal = parseInt(formDiscountValue, 10) || 0
    if (discountVal <= 0) {
      showToast('Mức giảm giá phải lớn hơn 0.', 'error')
      return
    }
    if (formType === 'PERCENTAGE' && (discountVal < 1 || discountVal > 100)) {
      showToast('Giảm theo phần trăm phải từ 1% đến 100%.', 'error')
      return
    }

    if (!formStartDate || !formEndDate) {
      showToast('Vui lòng chọn thời gian bắt đầu và kết thúc.', 'error')
      return
    }
    if (new Date(formEndDate) <= new Date(formStartDate)) {
      showToast('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.', 'error')
      return
    }

    const payload: CreateVoucherPayload = {
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      type: formType,
      discountValueMinor: discountVal,
      minOrderValueMinor: parseInt(formMinOrderValue, 10) || 0,
      maxDiscountAmountMinor: formType === 'PERCENTAGE' ? parseInt(formMaxDiscount, 10) || 0 : discountVal,
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      storeId: storeId, // Gán chặt chẽ theo storeId của seller
      categoryId: formScope === 'CATEGORY' ? formCategoryId : null,
      usageLimit: parseInt(formUsageLimit, 10) || 100
    }

    try {
      setCreating(true)
      const created = await sellerVoucherApi.createSellerVoucher(payload)
      setVouchers((prev) => [created, ...prev])
      showToast(`Đã tạo mã giảm giá [${created.code}] thành công!`, 'success')
      setIsCreateModalOpen(false)
    } catch (err: any) {
      showToast('Lỗi khi tạo voucher: ' + (err?.message || 'Không thành công'), 'error')
    } finally {
      setCreating(false)
    }
  }

  // Handle Toggle Status
  const handleToggle = async (v: AdminVoucherItem) => {
    try {
      const updated = await sellerVoucherApi.toggleVoucherStatus(v.id)
      setVouchers((prev) => prev.map((item) => (item.id === v.id ? updated : item)))
      showToast(
        `Đã chuyển mã [${v.code}] sang trạng thái ${updated.isActive ? 'ĐANG HOẠT ĐỘNG' : 'TẠM DỪNG'}.`,
        'success'
      )
    } catch (err: any) {
      showToast('Không thể thay đổi trạng thái: ' + (err?.message || 'Lỗi hệ thống'), 'error')
    }
  }

  // Handle Delete Voucher
  const handleConfirmDelete = async () => {
    if (!deletingVoucher) return
    try {
      setSubmittingDelete(true)
      await sellerVoucherApi.deleteVoucher(deletingVoucher.id)
      setVouchers((prev) => prev.filter((item) => item.id !== deletingVoucher.id))
      showToast(`Đã xóa vĩnh viễn voucher [${deletingVoucher.code}].`, 'success')
      setDeletingVoucher(null)
    } catch (err: any) {
      showToast('Lỗi khi xóa voucher: ' + (err?.message || 'Không thể xóa'), 'error')
    } finally {
      setSubmittingDelete(false)
    }
  }

  const nowTime = new Date().getTime()

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const startTime = new Date(v.startDate).getTime()
      const endTime = new Date(v.endDate).getTime()

      // Status tab
      if (statusFilter === 'ACTIVE') {
        if (!v.isActive || startTime > nowTime || endTime < nowTime || v.usedCount >= v.usageLimit) return false
      } else if (statusFilter === 'UPCOMING') {
        if (!v.isActive || startTime <= nowTime) return false
      } else if (statusFilter === 'EXPIRED') {
        if (v.isActive && endTime >= nowTime && v.usedCount < v.usageLimit) return false
      }

      // Type filter
      if (typeFilter !== 'ALL' && v.type !== typeFilter) return false

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (v.categoryId !== categoryFilter) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchCode = v.code.toLowerCase().includes(q)
        const matchTitle = v.title.toLowerCase().includes(q)
        if (!matchCode && !matchTitle) return false
      }

      return true
    })
  }, [vouchers, statusFilter, typeFilter, categoryFilter, searchQuery, nowTime])

  // Stats calculation
  const totalCount = vouchers.length
  const activeCount = vouchers.filter((v) => {
    const s = new Date(v.startDate).getTime()
    const e = new Date(v.endDate).getTime()
    return v.isActive && s <= nowTime && e >= nowTime && v.usedCount < v.usageLimit
  }).length
  const upcomingCount = vouchers.filter((v) => {
    const s = new Date(v.startDate).getTime()
    return v.isActive && s > nowTime
  }).length
  const totalUsedCount = vouchers.reduce((acc, v) => acc + (v.usedCount || 0), 0)

  return (
    <SellerLayout>
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Toast */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 99999,
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
                  justifyContent: 'center'
                }}
              >
                <Tag size={22} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Kênh Marketing — Mã Giảm Giá Của Shop
              </h1>
            </div>
            <p style={{ margin: '6px 0 0 48px', fontSize: 13.5, color: '#64748b' }}>
              Tạo và quản lý voucher độc quyền cho gian hàng <strong>{storeName || 'của bạn'}</strong> hoặc theo từng ngành hàng cụ thể.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={loadVouchers}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={openCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 20px',
                borderRadius: 8,
                backgroundColor: '#ee4d2d',
                border: 'none',
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(238, 77, 45, 0.25)'
              }}
            >
              <Plus size={16} />
              <span>Tạo Mã Giảm Giá Mới</span>
            </button>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}
        >
          <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
              <span>Tổng số Voucher</span>
              <Layers size={18} color="#6366f1" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{totalCount}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Toàn bộ chương trình đã tạo</div>
          </div>

          <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
              <span>Đang hiệu lực</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 8 }}>{activeCount}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Khách hàng có thể lưu và dùng ngay</div>
          </div>

          <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
              <span>Sắp diễn ra</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 8 }}>{upcomingCount}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Chờ đến thời gian bắt đầu</div>
          </div>

          <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
              <span>Lượt khách đã dùng</span>
              <Sparkles size={18} color="#ec4899" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{totalUsedCount}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Tổng lượt áp dụng tại đơn hàng</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 16,
            marginBottom: 20
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Đang diễn ra' },
              { id: 'UPCOMING', label: 'Sắp diễn ra' },
              { id: 'EXPIRED', label: 'Đã kết thúc / Tạm dừng' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  border: 'none',
                  backgroundColor: statusFilter === tab.id ? '#ee4d2d' : '#f8fafc',
                  color: statusFilter === tab.id ? '#ffffff' : '#64748b',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Select dropdowns */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm theo mã voucher hoặc tên chương trình..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                  outline: 'none'
                }}
              />
            </div>

            {/* Type filter */}
            <div style={{ minWidth: 160 }}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="ALL">Mọi loại giảm giá</option>
                <option value="PERCENTAGE">Theo phần trăm (%)</option>
                <option value="AMOUNT">Theo số tiền cố định (₫)</option>
              </select>
            </div>

            {/* Category filter */}
            <div style={{ minWidth: 200 }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="ALL">Mọi phạm vi danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('ALL')
                  setTypeFilter('ALL')
                  setCategoryFilter('ALL')
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Voucher Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div>Đang tải danh sách voucher của gian hàng...</div>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <Tag size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>Chưa có mã giảm giá nào phù hợp</div>
              <div style={{ fontSize: 13.5, marginTop: 4 }}>
                Nhấn vào nút <strong>"Tạo Mã Giảm Giá Mới"</strong> để thu hút khách hàng đến shop!
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '14px 18px' }}>MÃ & TÊN VOUCHER</th>
                    <th style={{ padding: '14px 18px' }}>LOẠI GIẢM GIÁ</th>
                    <th style={{ padding: '14px 18px' }}>ĐƠN TỐI THIỂU</th>
                    <th style={{ padding: '14px 18px' }}>PHẠM VI ÁP DỤNG</th>
                    <th style={{ padding: '14px 18px' }}>THỜI HẠN ÁP DỤNG</th>
                    <th style={{ padding: '14px 18px' }}>LƯỢT DÙNG</th>
                    <th style={{ padding: '14px 18px' }}>TRẠNG THÁI</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((v) => {
                    const startTime = new Date(v.startDate).getTime()
                    const endTime = new Date(v.endDate).getTime()
                    const isUpcoming = v.isActive && startTime > nowTime
                    const isRunning = v.isActive && startTime <= nowTime && endTime >= nowTime && v.usedCount < v.usageLimit
                    const isOver = !v.isActive || endTime < nowTime || v.usedCount >= v.usageLimit

                    return (
                      <tr
                        key={v.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Code & Title */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: 6,
                                backgroundColor: '#fef2f2',
                                border: '1px dashed #ef4444',
                                color: '#dc2626',
                                fontWeight: 800,
                                fontSize: 12.5,
                                letterSpacing: '0.5px'
                              }}
                            >
                              {v.code}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 4 }}>{v.title}</div>
                          {v.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{v.description}</div>}
                        </td>

                        {/* Type & Value */}
                        <td style={{ padding: '14px 18px' }}>
                          {v.type === 'PERCENTAGE' ? (
                            <div>
                              <span style={{ color: '#d97706', fontWeight: 700 }}>Giảm {v.discountValueMinor}%</span>
                              {v.maxDiscountAmountMinor > 0 && (
                                <div style={{ fontSize: 12, color: '#64748b' }}>Tối đa {formatMoney(v.maxDiscountAmountMinor)}</div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span style={{ color: '#059669', fontWeight: 700 }}>Giảm {formatMoney(v.discountValueMinor)}</span>
                            </div>
                          )}
                        </td>

                        {/* Min Order Value */}
                        <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 500 }}>
                          {v.minOrderValueMinor > 0 ? formatMoney(v.minOrderValueMinor) : '0 ₫ (Không giới hạn)'}
                        </td>

                        {/* Scope */}
                        <td style={{ padding: '14px 18px' }}>
                          {v.categoryId ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              <FolderTree size={12} />
                              {categoryMap[v.categoryId] || 'Theo ngành hàng'}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              <Store size={12} />
                              Toàn gian hàng
                            </span>
                          )}
                        </td>

                        {/* Date Range */}
                        <td style={{ padding: '14px 18px', fontSize: 12.5, color: '#475569' }}>
                          <div>{new Date(v.startDate).toLocaleDateString('vi-VN')}</div>
                          <div style={{ color: '#94a3b8' }}>đến {new Date(v.endDate).toLocaleDateString('vi-VN')}</div>
                        </td>

                        {/* Usage */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{v.usedCount}</span>
                          <span style={{ color: '#94a3b8' }}> / {v.usageLimit}</span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 18px' }}>
                          {isRunning && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: 12,
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                fontSize: 12,
                                fontWeight: 700
                              }}
                            >
                              ● Đang diễn ra
                            </span>
                          )}
                          {isUpcoming && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: 12,
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                fontSize: 12,
                                fontWeight: 700
                              }}
                            >
                              ● Sắp diễn ra
                            </span>
                          )}
                          {isOver && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: 12,
                                backgroundColor: '#f1f5f9',
                                color: '#64748b',
                                fontSize: 12,
                                fontWeight: 700
                              }}
                            >
                              ● Đã kết thúc
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleToggle(v)}
                              title={v.isActive ? 'Tạm dừng voucher' : 'Kích hoạt voucher'}
                              style={{
                                border: '1px solid #e2e8f0',
                                backgroundColor: v.isActive ? '#f0fdf4' : '#f8fafc',
                                color: v.isActive ? '#15803d' : '#94a3b8',
                                padding: 6,
                                borderRadius: 6,
                                cursor: 'pointer'
                              }}
                            >
                              <Power size={15} />
                            </button>

                            <button
                              onClick={() => setDeletingVoucher(v)}
                              title="Xóa voucher vĩnh viễn"
                              style={{
                                border: '1px solid #fee2e2',
                                backgroundColor: '#fff5f5',
                                color: '#dc2626',
                                padding: 6,
                                borderRadius: 6,
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
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

        {/* ── CREATE MODAL ── */}
        {isCreateModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                maxWidth: 620,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    Tạo Mã Giảm Giá Cho Gian Hàng
                  </h3>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    Áp dụng riêng cho shop <strong>{storeName}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateVoucher} style={{ padding: '20px 24px' }}>
                {/* 1. Scope selection */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                    1. Phạm vi áp dụng của voucher:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div
                      onClick={() => setFormScope('STORE_WIDE')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: formScope === 'STORE_WIDE' ? '2px solid #ee4d2d' : '1px solid #e2e8f0',
                        backgroundColor: formScope === 'STORE_WIDE' ? '#fff5f5' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                        <Store size={16} color={formScope === 'STORE_WIDE' ? '#ee4d2d' : '#64748b'} />
                        Toàn Gian Hàng
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Áp dụng cho mọi sản phẩm của shop
                      </div>
                    </div>

                    <div
                      onClick={() => setFormScope('CATEGORY')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: formScope === 'CATEGORY' ? '2px solid #ee4d2d' : '1px solid #e2e8f0',
                        backgroundColor: formScope === 'CATEGORY' ? '#fff5f5' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                        <FolderTree size={16} color={formScope === 'CATEGORY' ? '#ee4d2d' : '#64748b'} />
                        Theo 1 Danh Mục
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Chỉ áp dụng cho sản phẩm thuộc 1 ngành hàng
                      </div>
                    </div>
                  </div>

                  {/* Dropdown danh mục nếu chọn theo Category */}
                  {formScope === 'CATEGORY' && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Chọn danh mục ngành hàng áp dụng:
                      </label>
                      <select
                        value={formCategoryId}
                        onChange={(e) => setFormCategoryId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 13.5,
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Voucher Code & Title */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Mã Voucher *
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        placeholder="VD: SALE20K"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 13.5,
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        style={{
                          padding: '9px 10px',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Tự sinh
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Tên chương trình voucher *
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Tri ân khách hàng - Giảm 20K"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13.5
                      }}
                      required
                    />
                  </div>
                </div>

                {/* 3. Description */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Mô tả điều kiện (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Áp dụng cho đơn từ 100K trở lên"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13
                    }}
                  />
                </div>

                {/* 4. Type & Discount Value */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Loại giảm giá
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as VoucherType)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13.5,
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="AMOUNT">Số tiền cố định (₫)</option>
                      <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      {formType === 'PERCENTAGE' ? 'Mức giảm (%)' : 'Số tiền giảm (₫)'} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formType === 'PERCENTAGE' ? '100' : undefined}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13.5
                      }}
                      required
                    />
                  </div>
                </div>

                {/* 5. Min Order & Max Discount */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      Đơn hàng tối thiểu (₫)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMinOrderValue}
                      onChange={(e) => setFormMinOrderValue(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13.5
                      }}
                    />
                  </div>

                  {formType === 'PERCENTAGE' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Mức giảm tối đa (₫)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formMaxDiscount}
                        onChange={(e) => setFormMaxDiscount(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 13.5
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Lượt dùng tối đa
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formUsageLimit}
                        onChange={(e) => setFormUsageLimit(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 13.5
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 6. Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      Thời gian bắt đầu *
                    </label>
                    <input
                      type="datetime-local"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      Thời gian kết thúc *
                    </label>
                    <input
                      type="datetime-local"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
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
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      padding: '9px 22px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: '#ee4d2d',
                      color: '#ffffff',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: creating ? 0.7 : 1
                    }}
                  >
                    {creating && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    <span>{creating ? 'Đang tạo...' : 'Kích Hoạt Mã Giảm Giá'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── DELETE MODAL ── */}
        {deletingVoucher && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 14,
                maxWidth: 440,
                width: '100%',
                padding: 24,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Xác nhận xóa mã giảm giá?
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#64748b', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa vĩnh viễn voucher <strong>[{deletingVoucher.code}]</strong>? Khách hàng sẽ không thể tiếp tục lưu hoặc sử dụng mã này.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button
                  onClick={() => setDeletingVoucher(null)}
                  disabled={submittingDelete}
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
                  Hủy bỏ
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={submittingDelete}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {submittingDelete && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  <span>{submittingDelete ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerVouchersPage
