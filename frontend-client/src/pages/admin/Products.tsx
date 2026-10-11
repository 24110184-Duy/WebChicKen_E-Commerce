import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  AlertCircle,
  Package,
  Store,
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { adminProductApi } from '../../features/admin/api/adminProductApi'
import type {
  AdminProductItem,
  ProductModerationFilterTab,
} from '../../features/admin/types'
import { ProductDetailModal } from '../../features/admin/components/ProductDetailModal'
import { ProductRejectModal } from '../../features/admin/components/ProductRejectModal'

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<AdminProductItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<ProductModerationFilterTab>('PENDING_APPROVAL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<AdminProductItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [rejectingProduct, setRejectingProduct] = useState<AdminProductItem | null>(null)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Load products
  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await adminProductApi.getProducts()
      setProducts(data.items)
    } catch (err) {
      console.error('Failed to load products for moderation:', err)
      showToast('Không thể tải danh sách sản phẩm kiểm duyệt.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = products.length
    const pending = products.filter((p) => p.status === 'PENDING_APPROVAL').length
    const botApproved = products.filter((p) => p.moderatedBy === 'BOT_AUTO_APPROVER').length
    const adminApproved = products.filter((p) => p.status === 'ACTIVE' && p.moderatedBy !== 'BOT_AUTO_APPROVER').length
    const active = products.filter((p) => p.status === 'ACTIVE').length
    const inactive = products.filter((p) => p.status === 'INACTIVE').length
    return { total, pending, botApproved, adminApproved, active, inactive }
  }, [products])

  // Filter & Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Tab filter
      if (activeTab === 'PENDING_APPROVAL' && p.status !== 'PENDING_APPROVAL') return false
      if (activeTab === 'ACTIVE' && p.status !== 'ACTIVE') return false
      if (activeTab === 'BOT_APPROVED' && p.moderatedBy !== 'BOT_AUTO_APPROVER') return false
      if (activeTab === 'ADMIN_APPROVED' && (p.status !== 'ACTIVE' || p.moderatedBy === 'BOT_AUTO_APPROVER')) return false
      if (activeTab === 'INACTIVE' && p.status !== 'INACTIVE') return false

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = p.name.toLowerCase().includes(q)
        const matchStore = p.storeName?.toLowerCase().includes(q) ?? false
        const matchCat = p.categoryName?.toLowerCase().includes(q) ?? false
        const matchOrigin = p.origin?.toLowerCase().includes(q) ?? false
        const matchModerator = p.moderatedBy?.toLowerCase().includes(q) ?? false
        const matchNote = p.moderationNote?.toLowerCase().includes(q) ?? false
        return matchName || matchStore || matchCat || matchOrigin || matchModerator || matchNote
      }

      return true
    })
  }, [products, activeTab, searchQuery])

  // Handlers
  const handleOpenDetail = (p: AdminProductItem) => {
    setSelectedProduct(p)
    setIsDetailModalOpen(true)
  }

  const handleApprove = async (p: AdminProductItem) => {
    setIsSubmitting(true)
    try {
      await adminProductApi.reviewProduct(p.id, { status: 'ACTIVE' })
      showToast(`Đã phê duyệt sản phẩm "${p.name}" cho phép mở bán công khai!`, 'success')
      setIsDetailModalOpen(false)
      loadProducts()
    } catch (err: any) {
      console.error(err)
      const msg = err?.message || err?.error?.message || 'Có lỗi xảy ra khi phê duyệt sản phẩm.'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenReject = (p: AdminProductItem) => {
    setRejectingProduct(p)
    setIsRejectModalOpen(true)
  }

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingProduct) return
    setIsSubmitting(true)
    try {
      await adminProductApi.reviewProduct(rejectingProduct.id, {
        status: 'INACTIVE',
        rejectionReason: reason,
      })
      showToast(
        `Đã từ chối kiểm duyệt sản phẩm "${rejectingProduct.name}".`,
        'success'
      )
      setIsRejectModalOpen(false)
      setIsDetailModalOpen(false)
      setRejectingProduct(null)
      loadProducts()
    } catch (err: any) {
      console.error(err)
      const msg = err?.message || err?.error?.message || 'Lỗi khi từ chối sản phẩm.'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(minor / 100)
  }

  return (
    <AdminLayout>
      <div className="mod-container">
        {/* Toast Alert */}
        {toastMessage && (
          <div className={`mod-toast ${toastMessage.type}`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Header & Title */}
        <div className="mod-header">
          <div className="mod-header-left">
            <div className="mod-header-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="mod-header-title">
                Kiểm Duyệt Sản Phẩm (Product Moderation)
              </h1>
              <p className="mod-header-subtitle">
                Thẩm định nguồn gốc xuất xứ, thông tin pháp lý, chất lượng sản phẩm và phân loại SKU trước khi công khai trên sàn WebChicKen.
              </p>
            </div>
          </div>

          <div className="mod-header-actions">
            <Link to="/seller/products?action=new" className="mod-btn-create">
              <Package size={15} />
              <span>Thêm Sản Phẩm Mới (Seller Center)</span>
            </Link>

            <button
              onClick={() => {
                loadProducts()
                showToast('Đã làm mới danh sách sản phẩm từ hệ thống.', 'success')
              }}
              className="mod-btn-refresh"
            >
              <RotateCcw size={14} />
              <span>Làm mới Danh sách</span>
            </button>
          </div>
        </div>

        {/* 2. Banner: Cơ chế kiểm duyệt 2 luồng */}
        <div className="mod-banner">
          <div className="mod-banner-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="mod-banner-content">
            <div className="mod-banner-heading">
              <span>Hệ Thống Kiểm Duyệt Sản Phẩm 2 Luồng</span>
              <span className="mod-banner-tag">Dual-Track AI & Admin</span>
            </div>
            <div className="mod-banner-desc">
              • <b>Luồng 1 (BOT AI tự động):</b> Đồ thông thường hợp lệ (thời trang, đồ gia dụng, nông sản...) được duyệt mở bán ngay.<br />
              • <b>Luồng 2 (Admin thẩm định an toàn):</b> Món hàng khả nghi hoặc tag/tên liên quan đến sức khỏe, thuốc, thực phẩm chức năng... bắt buộc Quản trị viên duyệt chứng chỉ an toàn.
            </div>
          </div>
        </div>

        {/* 3. Bento KPI Cards (5 Thẻ chỉ số) */}
        <div className="mod-kpi-grid">
          {/* Card 1: Chờ Admin duyệt */}
          <div
            onClick={() => setActiveTab('PENDING_APPROVAL')}
            className={`mod-kpi-card pending ${activeTab === 'PENDING_APPROVAL' ? 'active' : ''}`}
          >
            <div className="mod-kpi-header">
              <span className="mod-kpi-label">CHỜ ADMIN DUYỆT</span>
              <div className="mod-kpi-icon">
                <Clock size={17} />
              </div>
            </div>
            <div className="mod-kpi-value">{stats.pending}</div>
            <span className="mod-kpi-sub">Nghi vấn thuốc / an toàn</span>
          </div>

          {/* Card 2: Bot tự duyệt */}
          <div
            onClick={() => setActiveTab('BOT_APPROVED')}
            className={`mod-kpi-card bot ${activeTab === 'BOT_APPROVED' ? 'active' : ''}`}
          >
            <div className="mod-kpi-header">
              <span className="mod-kpi-label">BOT TỰ DUYỆT</span>
              <div className="mod-kpi-icon">
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div className="mod-kpi-value">{stats.botApproved}</div>
            <span className="mod-kpi-sub">Đạt chuẩn thông thường</span>
          </div>

          {/* Card 3: Admin đã duyệt */}
          <div
            onClick={() => setActiveTab('ADMIN_APPROVED')}
            className={`mod-kpi-card approved ${activeTab === 'ADMIN_APPROVED' ? 'active' : ''}`}
          >
            <div className="mod-kpi-header">
              <span className="mod-kpi-label">ADMIN ĐÃ DUYỆT</span>
              <div className="mod-kpi-icon">
                <ShieldCheck size={17} />
              </div>
            </div>
            <div className="mod-kpi-value">{stats.adminApproved}</div>
            <span className="mod-kpi-sub">Thẩm định an toàn</span>
          </div>

          {/* Card 4: Bị từ chối / Tạm khóa */}
          <div
            onClick={() => setActiveTab('INACTIVE')}
            className={`mod-kpi-card rejected ${activeTab === 'INACTIVE' ? 'active' : ''}`}
          >
            <div className="mod-kpi-header">
              <span className="mod-kpi-label">TỪ CHỐI / TẠM KHÓA</span>
              <div className="mod-kpi-icon">
                <XCircle size={17} />
              </div>
            </div>
            <div className="mod-kpi-value">{stats.inactive}</div>
            <span className="mod-kpi-sub">Vi phạm hoặc chưa đạt</span>
          </div>

          {/* Card 5: Tổng sản phẩm */}
          <div
            onClick={() => setActiveTab('ALL')}
            className={`mod-kpi-card total ${activeTab === 'ALL' ? 'active' : ''}`}
          >
            <div className="mod-kpi-header">
              <span className="mod-kpi-label">TỔNG SẢN PHẨM</span>
              <div className="mod-kpi-icon">
                <Package size={17} />
              </div>
            </div>
            <div className="mod-kpi-value">{stats.total}</div>
            <span className="mod-kpi-sub">Toàn sàn WebChicKen</span>
          </div>
        </div>

        {/* 4. Filter Bar & Data Table Card */}
        <div className="mod-content-card">
          <div className="mod-toolbar">
            {/* Tabs Group */}
            <div className="mod-tabs-group">
              {(
                [
                  { key: 'PENDING_APPROVAL', label: 'Chờ Admin duyệt (Sức khỏe)', count: stats.pending },
                  { key: 'BOT_APPROVED', label: 'Bot AI duyệt', count: stats.botApproved },
                  { key: 'ADMIN_APPROVED', label: 'Admin đã duyệt', count: stats.adminApproved },
                  { key: 'INACTIVE', label: 'Bị từ chối', count: stats.inactive },
                  { key: 'ALL', label: 'Tất cả', count: stats.total },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`mod-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                >
                  <span>{tab.label}</span>
                  <span className="mod-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="mod-search-box">
              <Search size={16} className="mod-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên sản phẩm, người duyệt, ghi chú..."
                className="mod-search-input"
              />
            </div>
          </div>

          {/* Data Table / Empty States */}
          {isLoading ? (
            <div style={{ padding: 56, textAlign: 'center', color: '#64748b' }}>
              Đang tải danh sách sản phẩm...
            </div>
          ) : filteredProducts.length === 0 ? (
            activeTab === 'PENDING_APPROVAL' && stats.pending === 0 && !searchQuery.trim() ? (
              // Empty State Thông Minh khi không có sản phẩm nào cần Quản trị viên duyệt
              <div className="mod-empty-state">
                <div className="mod-empty-icon-wrap safe">
                  <ShieldCheck size={38} />
                </div>
                <h3 className="mod-empty-title">
                  Tất cả sản phẩm đã an toàn & được phê duyệt!
                </h3>
                <p className="mod-empty-desc">
                  Hiện không có sản phẩm nào thuộc luồng y tế/sức khỏe cần Quản trị viên thẩm định. Toàn bộ sản phẩm trên sàn WebChicKen đã được mở bán an toàn hoặc tự động xử lý bởi BOT AI.
                </p>
                <button
                  className="mod-empty-action-btn"
                  onClick={() => setActiveTab('ALL')}
                >
                  <Package size={15} />
                  <span>Xem danh sách tất cả ({stats.total}) sản phẩm trên sàn</span>
                </button>
              </div>
            ) : (
              // Empty State trung tính cho tìm kiếm hoặc các tab khác
              <div className="mod-empty-state">
                <div className="mod-empty-icon-wrap neutral">
                  <Package size={38} />
                </div>
                <h3 className="mod-empty-title">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="mod-empty-desc">
                  {searchQuery.trim()
                    ? `Không tìm thấy kết quả nào khớp với từ khóa "${searchQuery}". Hãy thử kiểm tra lại chính tả hoặc xóa bộ lọc tìm kiếm.`
                    : 'Hiện chưa có sản phẩm nào trong danh mục lọc này.'}
                </p>
                {searchQuery.trim() ? (
                  <button
                    className="mod-empty-action-btn"
                    onClick={() => setSearchQuery('')}
                    style={{ background: '#475569' }}
                  >
                    <RotateCcw size={14} />
                    <span>Xóa từ khóa tìm kiếm</span>
                  </button>
                ) : (
                  <button
                    className="mod-empty-action-btn"
                    onClick={() => setActiveTab('ALL')}
                  >
                    <Package size={15} />
                    <span>Xem tất cả ({stats.total}) sản phẩm</span>
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="mod-table-responsive">
              <table className="mod-table">
                <thead className="mod-thead">
                  <tr>
                    <th className="mod-th">Sản phẩm</th>
                    <th className="mod-th">Gian hàng & Xuất xứ</th>
                    <th className="mod-th">Giá & Kho</th>
                    <th className="mod-th">Trạng thái</th>
                    <th className="mod-th">Người duyệt / Cơ chế</th>
                    <th className="mod-th">Ngày nộp</th>
                    <th className="mod-th right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="mod-tbody">
                  {filteredProducts.map((p) => {
                    return (
                      <tr key={p.id}>
                        {/* Column 1: Image & Name */}
                        <td className="mod-td">
                          <div className="mod-product-cell">
                            <img
                              src={
                                p.thumbnailUrl ||
                                'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=200&q=80'
                              }
                              alt={p.name}
                              className="mod-product-thumb"
                            />
                            <div className="mod-product-details">
                              <span className="mod-cat-badge">
                                {p.categoryName || 'Gia cầm'}
                              </span>
                              <div className="mod-product-name" title={p.name}>
                                {p.name}
                              </div>
                              <span className="mod-product-sku">Mã: {p.id.slice(0, 16)}...</span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Store & Origin */}
                        <td className="mod-td">
                          <div className="mod-store-title">
                            <Store size={14} color="#d97706" />
                            <span>{p.storeName || p.storeId}</span>
                          </div>
                          <div className="mod-origin-sub">
                            📍 {p.origin || 'Chưa cập nhật'}
                          </div>
                          {p.farmingStandard && (
                            <div className="mod-standard-tag">
                              ✓ {p.farmingStandard}
                            </div>
                          )}
                        </td>

                        {/* Column 3: Price & Stock */}
                        <td className="mod-td">
                          <div className="mod-price-val">
                            {formatPrice(p.minPriceMinor)}
                          </div>
                          <div className="mod-stock-val">
                            Kho: <b>{p.totalStock}</b> sản phẩm
                          </div>
                        </td>

                        {/* Column 4: Status */}
                        <td className="mod-td">
                          {p.status === 'ACTIVE' && (
                            <span className="mod-status-pill active">
                              <CheckCircle2 size={13} />
                              <span>Đã Duyệt</span>
                            </span>
                          )}
                          {p.status === 'INACTIVE' && (
                            <div>
                              <span className="mod-status-pill rejected">
                                <XCircle size={13} />
                                <span>Bị Từ Chối</span>
                              </span>
                              {p.rejectionReason && (
                                <div
                                  className="mod-rejection-hint"
                                  title={p.rejectionReason}
                                >
                                  Lý do: {p.rejectionReason}
                                </div>
                              )}
                            </div>
                          )}
                          {p.status === 'PENDING_APPROVAL' && (
                            <span className="mod-status-pill pending">
                              <Clock size={13} />
                              <span>Chờ Phê Duyệt</span>
                            </span>
                          )}
                        </td>

                        {/* Column 5: Moderated By / Audit Mode */}
                        <td className="mod-td">
                          {p.moderatedBy === 'BOT_AUTO_APPROVER' ? (
                            <div>
                              <span className="mod-mode-pill bot">
                                🤖 BOT Tự Động Duyệt
                              </span>
                              <div className="mod-mode-sub">
                                Đạt chuẩn thông thường
                              </div>
                            </div>
                          ) : p.moderatedBy ? (
                            <div>
                              <span className="mod-mode-pill admin">
                                🛡️ {p.moderatedBy}
                              </span>
                              <div className="mod-mode-sub">
                                Quản trị viên thẩm định
                              </div>
                            </div>
                          ) : p.status === 'PENDING_APPROVAL' ? (
                            <div>
                              <span className="mod-mode-pill suspicious">
                                ⚠️ Cần Admin duyệt
                              </span>
                              <div className="mod-mode-sub danger">
                                Nghi vấn thuốc / sức khỏe
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* Column 6: Date */}
                        <td className="mod-td" style={{ color: '#64748b', fontSize: 12 }}>
                          {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Column 7: Actions */}
                        <td className="mod-td right">
                          <div className="mod-actions-wrap">
                            <button
                              onClick={() => handleOpenDetail(p)}
                              title="Xem chi tiết thẩm định"
                              className="mod-btn-action detail"
                            >
                              <Eye size={13} />
                              <span>Chi tiết</span>
                            </button>

                            {p.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleApprove(p)}
                                  disabled={isSubmitting}
                                  title="Duyệt mở bán"
                                  className="mod-btn-action approve"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Duyệt</span>
                                </button>

                                <button
                                  onClick={() => handleOpenReject(p)}
                                  disabled={isSubmitting}
                                  title="Từ chối sản phẩm"
                                  className="mod-btn-action reject"
                                >
                                  <XCircle size={13} />
                                  <span>Từ chối</span>
                                </button>
                              </>
                            )}

                            {p.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleOpenReject(p)}
                                disabled={isSubmitting}
                                title="Tạm khóa / Hạ khỏi sàn"
                                className="mod-btn-action reject"
                              >
                                Tạm khóa
                              </button>
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

        {/* Modals */}
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          product={selectedProduct}
          onClose={() => setIsDetailModalOpen(false)}
          onApprove={handleApprove}
          onReject={(p) => {
            setIsDetailModalOpen(false)
            handleOpenReject(p)
          }}
          isSubmitting={isSubmitting}
        />

        <ProductRejectModal
          isOpen={isRejectModalOpen}
          productName={rejectingProduct?.name || ''}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirm={handleConfirmReject}
          isSubmitting={isSubmitting}
        />
      </div>
    </AdminLayout>
  )
}

export default AdminProductsPage
