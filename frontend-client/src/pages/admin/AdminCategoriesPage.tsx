import React, { useState, useEffect, useCallback } from 'react'
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Copy,
  Check,
  X
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import {
  adminCategoryApi,
  type CategoryItem
} from '../../features/admin/api/adminCategoryApi'

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
]

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [formName, setFormName] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  // Delete Confirm Modal
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminCategoryApi.getCategories()
      setCategories(data)
    } catch (err: any) {
      console.error('Lỗi khi tải danh mục:', err)
      showToast('Không thể tải danh sách danh mục.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormName('')
    setFormDescription('')
    setIsModalOpen(true)
  }

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormDescription(cat.description || '')
    setIsModalOpen(true)
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      showToast('Tên danh mục không được để trống.', 'error')
      return
    }

    try {
      setSaving(true)
      if (editingCategory) {
        const updated = await adminCategoryApi.updateCategory(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined
        })
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        showToast(`Đã cập nhật danh mục "${updated.name}" thành công!`, 'success')
      } else {
        const created = await adminCategoryApi.createCategory({
          name: formName.trim(),
          description: formDescription.trim() || undefined
        })
        setCategories((prev) => [created, ...prev])
        showToast(`Đã thêm mới danh mục "${created.name}" thành công!`, 'success')
      }
      setIsModalOpen(false)
    } catch (err: any) {
      showToast('Lỗi lưu danh mục: ' + (err?.message || 'Không xác định'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminCategoryApi.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      showToast('Đã xóa danh mục thành công!', 'success')
      setDeletingCategory(null)
    } catch (err: any) {
      showToast('Lỗi khi xóa danh mục: ' + (err?.message || 'Không thể xóa'), 'error')
    }
  }

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
  })

  return (
    <AdminLayout>
      <div className="cat-page-container">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: 10,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: toastMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${toastMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              animation: 'catModalFadeIn 0.2s ease-out'
            }}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981', flexShrink: 0 }} />
            ) : (
              <AlertCircle style={{ width: 18, height: 18, color: '#ef4444', flexShrink: 0 }} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Page Header */}
        <div className="cat-header">
          <div className="cat-header-left">
            <div className="cat-header-icon-box">
              <FolderTree size={24} />
            </div>
            <div className="cat-header-text">
              <h1>Cây Danh Mục Sản Phẩm (Categories Tree)</h1>
              <p>Phân loại danh mục đa cấp, định danh nhóm hàng hóa và điều hướng cho toàn bộ sàn WebChicKen.</p>
            </div>
          </div>

          <div className="cat-header-actions">
            <button
              type="button"
              onClick={loadCategories}
              disabled={loading}
              className="cat-btn-secondary"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="cat-btn-primary"
            >
              <Plus size={16} />
              <span>Thêm Danh Mục</span>
            </button>
          </div>
        </div>

        {/* 2. Bento Metrics Grid */}
        <div className="cat-bento-grid">
          <div className="cat-bento-card theme-indigo">
            <div className="cat-bento-meta">
              <span className="cat-bento-label">Tổng danh mục</span>
              <span className="cat-bento-value">{categories.length}</span>
              <span className="cat-bento-sub success">● Đang hoạt động</span>
            </div>
            <div className="cat-bento-icon">
              <Layers size={24} />
            </div>
          </div>

          <div className="cat-bento-card theme-amber">
            <div className="cat-bento-meta">
              <span className="cat-bento-label">Chuẩn phân loại</span>
              <span className="cat-bento-value">Chuẩn 2.0</span>
              <span className="cat-bento-sub muted">E-Commerce Taxonomy</span>
            </div>
            <div className="cat-bento-icon">
              <Tag size={24} />
            </div>
          </div>

          <div className="cat-bento-card theme-emerald">
            <div className="cat-bento-meta">
              <span className="cat-bento-label">Kiểm soát an toàn</span>
              <span className="cat-bento-value">Bật</span>
              <span className="cat-bento-sub success">Quét từ khóa y tế/thuốc</span>
            </div>
            <div className="cat-bento-icon">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="cat-bento-card theme-purple">
            <div className="cat-bento-meta">
              <span className="cat-bento-label">Khớp bộ lọc</span>
              <span className="cat-bento-value" style={{ color: '#7c3aed' }}>
                {filteredCategories.length}
              </span>
              <span className="cat-bento-sub highlight">Kết quả hiển thị</span>
            </div>
            <div className="cat-bento-icon">
              <FolderTree size={24} />
            </div>
          </div>
        </div>

        {/* 3. Search & Quick Filter Bar */}
        <div className="cat-filter-card">
          <div className="cat-search-box">
            <Search size={18} className="cat-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm danh mục theo tên hoặc mô tả chi tiết..."
              className="cat-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="cat-search-clear"
                title="Xóa bộ lọc tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          <div className="cat-filter-count-badge">
            <span>Hiển thị <strong>{filteredCategories.length}</strong> / {categories.length} danh mục</span>
          </div>
        </div>

        {/* 4. Categories Table Card */}
        <div className="cat-table-card">
          {loading ? (
            <div className="cat-loading-state">
              <RefreshCw className="cat-loading-spinner" />
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Đang tải cây danh mục từ máy chủ...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="cat-empty-state">
              <div className="cat-empty-icon-wrap">
                <FolderTree size={28} />
              </div>
              <h4 className="cat-empty-title">Không tìm thấy danh mục nào</h4>
              <p className="cat-empty-subtitle">
                {searchQuery
                  ? `Không có danh mục nào khớp với từ khóa "${searchQuery}".`
                  : 'Chưa có danh mục sản phẩm nào được tạo trên hệ thống.'}
              </p>
            </div>
          ) : (
            <div className="cat-table-responsive">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>Tên Danh Mục</th>
                    <th>Mã Phân Loại (ID)</th>
                    <th>Mô Tả Chi Tiết</th>
                    <th>Ngày Tạo</th>
                    <th className="text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat, idx) => {
                    const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                    const initialLetter = cat.name ? cat.name.charAt(0).toUpperCase() : 'C'

                    return (
                      <tr key={cat.id}>
                        {/* Name & Avatar */}
                        <td>
                          <div className="cat-cell-name">
                            <div className="cat-avatar-initial" style={{ background: gradient }}>
                              {initialLetter}
                            </div>
                            <div className="cat-title-cell-text">
                              <span className="cat-name-primary">{cat.name}</span>
                              <span className="cat-name-sub">Danh mục niêm yết</span>
                            </div>
                          </div>
                        </td>

                        {/* ID Badge + Copy */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <span
                              className="cat-id-badge"
                              title={`Mã phân loại đầy đủ: ${cat.id}\nNhấp icon bên cạnh để sao chép`}
                            >
                              {cat.id.length > 18 ? `${cat.id.slice(0, 8)}...${cat.id.slice(-6)}` : cat.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(cat.id)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: copiedId === cat.id ? '#10b981' : '#94a3b8',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                transition: 'color 0.15s ease'
                              }}
                              title={copiedId === cat.id ? 'Đã sao chép toàn bộ ID!' : 'Sao chép mã ID đầy đủ'}
                            >
                              {copiedId === cat.id ? <Check size={14} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        {/* Description */}
                        <td>
                          {cat.description ? (
                            <span className="cat-desc-text" title={cat.description}>
                              {cat.description}
                            </span>
                          ) : (
                            <span className="cat-desc-empty">Không có mô tả</span>
                          )}
                        </td>

                        {/* Date */}
                        <td>
                          <div className="cat-date-pill">
                            <Calendar size={14} style={{ color: '#94a3b8' }} />
                            <span>
                              {cat.createdAt
                                ? new Date(cat.createdAt).toLocaleDateString('vi-VN')
                                : '10/10/2026'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="text-right">
                          <div className="cat-actions-cell">
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="cat-action-btn edit"
                              title="Chỉnh sửa danh mục"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(cat)}
                              className="cat-action-btn delete"
                              title="Xóa danh mục"
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

        {/* 5. Create / Edit Modal */}
        {isModalOpen && (
          <div className="cat-modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div className="cat-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="cat-modal-header">
                <div className="cat-modal-title-wrap">
                  <div className="cat-modal-title-icon">
                    <FolderTree size={18} />
                  </div>
                  <h3>{editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cat-modal-close-btn"
                  title="Đóng hộp thoại"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="cat-modal-body">
                  <div className="cat-form-group">
                    <label className="cat-form-label">
                      Tên Danh Mục <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ví dụ: Máy Tính & Laptop, Đồ Gia Dụng..."
                      className="cat-form-input"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="cat-form-group">
                    <label className="cat-form-label">Mô Tả Chi Tiết</label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Mô tả tiêu chuẩn ngành hàng, phạm vi sản phẩm thuộc nhóm này..."
                      className="cat-form-textarea"
                    />
                  </div>
                </div>

                <div className="cat-modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cat-btn-cancel"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="cat-btn-submit"
                  >
                    {saving && <RefreshCw size={14} className="animate-spin" />}
                    <span>{editingCategory ? 'Cập Nhật Danh Mục' : 'Tạo Danh Mục Mới'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Delete Confirmation Modal */}
        {deletingCategory && (
          <div className="cat-modal-backdrop" onClick={() => setDeletingCategory(null)}>
            <div className="cat-delete-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="cat-delete-icon-box">
                <Trash2 size={26} />
              </div>
              <h3 className="cat-delete-title">Xác nhận xóa danh mục</h3>
              <p className="cat-delete-desc">
                Bạn có chắc chắn muốn xóa danh mục <strong>"{deletingCategory.name}"</strong>?
                <br />
                Hành động này sẽ gỡ bỏ phân loại danh mục khỏi hệ thống sàn WebChicKen.
              </p>
              <div className="cat-delete-actions">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="cat-btn-cancel"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingCategory.id)}
                  className="cat-btn-danger"
                >
                  Xác Nhận Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminCategoriesPage
