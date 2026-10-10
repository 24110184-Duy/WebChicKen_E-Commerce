import React, { useState, useEffect, useMemo } from 'react'
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
    const active = products.filter((p) => p.status === 'ACTIVE').length
    const inactive = products.filter((p) => p.status === 'INACTIVE').length
    return { total, pending, active, inactive }
  }, [products])

  // Filter & Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Tab filter
      if (activeTab !== 'ALL' && p.status !== activeTab) {
        return false
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = p.name.toLowerCase().includes(q)
        const matchStore = p.storeName?.toLowerCase().includes(q) ?? false
        const matchCat = p.categoryName?.toLowerCase().includes(q) ?? false
        const matchOrigin = p.origin?.toLowerCase().includes(q) ?? false
        return matchName || matchStore || matchCat || matchOrigin
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
    } catch (err) {
      console.error(err)
      showToast('Có lỗi xảy ra khi phê duyệt sản phẩm.', 'error')
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
    } catch (err) {
      console.error(err)
      showToast('Lỗi khi từ chối sản phẩm.', 'error')
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
      <div style={{ padding: '24px 32px' }}>
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 32,
              zIndex: 10000,
              backgroundColor: toastMessage.type === 'success' ? '#059669' : '#dc2626',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Header & Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                Kiểm Duyệt Sản Phẩm (Product Moderation)
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
              Thẩm định nguồn gốc xuất xứ, thông tin pháp lý, chất lượng sản phẩm và phân loại SKU trước khi công khai trên sàn WebChicKen.
            </p>
          </div>

          <button
            onClick={() => {
              loadProducts()
              showToast('Đã làm mới danh sách sản phẩm từ hệ thống.', 'success')
            }}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RotateCcw size={14} />
            <span>Làm mới Danh sách</span>
          </button>
        </div>

        {/* 2. Bento KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            onClick={() => setActiveTab('PENDING_APPROVAL')}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: activeTab === 'PENDING_APPROVAL' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>CHỜ KIỂM DUYỆT</span>
              <Clock size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 8 }}>
              {stats.pending}
            </div>
            <span style={{ fontSize: 12, color: '#b45309' }}>Cần Admin thẩm định gấp</span>
          </div>

          <div
            onClick={() => setActiveTab('ACTIVE')}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: activeTab === 'ACTIVE' ? '2px solid #10b981' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>ĐÃ PHÊ DUYỆT</span>
              <CheckCircle2 size={18} color="#059669" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 8 }}>
              {stats.active}
            </div>
            <span style={{ fontSize: 12, color: '#047857' }}>Đang bán công khai</span>
          </div>

          <div
            onClick={() => setActiveTab('INACTIVE')}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: activeTab === 'INACTIVE' ? '2px solid #ef4444' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>TỪ CHỐI / TẠM KHÓA</span>
              <XCircle size={18} color="#dc2626" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', marginTop: 8 }}>
              {stats.inactive}
            </div>
            <span style={{ fontSize: 12, color: '#b91c1c' }}>Vi phạm hoặc chưa đạt</span>
          </div>

          <div
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: activeTab === 'ALL' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>TỔNG SẢN PHẨM</span>
              <Package size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
              {stats.total}
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Trên toàn sàn WebChicKen</span>
          </div>
        </div>

        {/* 3. Search Bar & Filter Tabs */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(
                [
                  { key: 'PENDING_APPROVAL', label: 'Chờ duyệt', count: stats.pending },
                  { key: 'ACTIVE', label: 'Đã duyệt', count: stats.active },
                  { key: 'INACTIVE', label: 'Bị từ chối', count: stats.inactive },
                  { key: 'ALL', label: 'Tất cả', count: stats.total },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeTab === tab.key ? '#0f172a' : '#f1f5f9',
                    color: activeTab === tab.key ? '#ffffff' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 10,
                      backgroundColor: activeTab === tab.key ? '#334155' : '#e2e8f0',
                      color: activeTab === tab.key ? '#ffffff' : '#64748b',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: 320 }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: 12, top: 11 }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên sản phẩm, gian hàng, xuất xứ..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* 4. Products Table */}
          {isLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              Đang tải danh sách sản phẩm...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <Package size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#334155' }}>
                Không tìm thấy sản phẩm nào
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                Thử thay đổi bộ lọc tab hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead
                  style={{
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Sản phẩm</th>
                    <th style={{ padding: '12px 16px' }}>Gian hàng & Xuất xứ</th>
                    <th style={{ padding: '12px 16px' }}>Giá & Kho</th>
                    <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px' }}>Ngày nộp</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 13 }}>
                  {filteredProducts.map((p) => {
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          transition: 'background-color 0.1s',
                        }}
                      >
                        {/* Column 1: Image & Name */}
                        <td style={{ padding: '14px 16px', maxWidth: 300 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <img
                              src={
                                p.thumbnailUrl ||
                                'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=200&q=80'
                              }
                              alt={p.name}
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 8,
                                objectFit: 'cover',
                                border: '1px solid #e2e8f0',
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#7c3aed',
                                  backgroundColor: '#f5f3ff',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                {p.categoryName || 'Gia cầm'}
                              </span>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  fontSize: 13,
                                  marginTop: 2,
                                  lineHeight: 1.3,
                                }}
                              >
                                {p.name}
                              </div>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>Mã: {p.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Store & Origin */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <Store size={14} color="#d97706" />
                            <span>{p.storeName || p.storeId}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                            📍 {p.origin || 'Chưa cập nhật'}
                          </div>
                          {p.farmingStandard && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#16a34a',
                                fontWeight: 600,
                                marginTop: 2,
                              }}
                            >
                              ✓ {p.farmingStandard}
                            </div>
                          )}
                        </td>

                        {/* Column 3: Price & Stock */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#ea580c' }}>
                            {formatPrice(p.minPriceMinor)}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Kho: <b>{p.totalStock}</b> sản phẩm
                          </div>
                        </td>

                        {/* Column 4: Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {p.status === 'ACTIVE' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Đã Duyệt</span>
                            </span>
                          )}
                          {p.status === 'INACTIVE' && (
                            <div>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                }}
                              >
                                <XCircle size={13} />
                                <span>Bị Từ Chối</span>
                              </span>
                              {p.rejectionReason && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#b91c1c',
                                    maxWidth: 180,
                                    marginTop: 4,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={p.rejectionReason}
                                >
                                  Lý do: {p.rejectionReason}
                                </div>
                              )}
                            </div>
                          )}
                          {p.status === 'PENDING_APPROVAL' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: '#fffbeb',
                                color: '#d97706',
                                border: '1px solid #fde68a',
                              }}
                            >
                              <Clock size={13} />
                              <span>Chờ Phê Duyệt</span>
                            </span>
                          )}
                        </td>

                        {/* Column 5: Date */}
                        <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>
                          {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Column 6: Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              justifyContent: 'flex-end',
                            }}
                          >
                            <button
                              onClick={() => handleOpenDetail(p)}
                              title="Xem chi tiết thẩm định"
                              style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#334155',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
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
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    border: 'none',
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Duyệt</span>
                                </button>

                                <button
                                  onClick={() => handleOpenReject(p)}
                                  disabled={isSubmitting}
                                  title="Từ chối sản phẩm"
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    border: 'none',
                                    backgroundColor: '#fee2e2',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
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
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: '1px solid #fecaca',
                                  backgroundColor: '#fff',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                }}
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
