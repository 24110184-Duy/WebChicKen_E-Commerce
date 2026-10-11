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
  ShieldCheck
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import {
  adminCategoryApi,
  type CategoryItem
} from '../../features/admin/api/adminCategoryApi'

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [formName, setFormName] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  // Delete Confirm Modal
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      setDeletingId(null)
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
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: toastMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${toastMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981' }} />
            ) : (
              <AlertCircle style={{ width: 18, height: 18, color: '#ef4444' }} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FolderTree style={{ width: 24, height: 24, color: '#4f46e5' }} />
              <h1 className="text-2xl font-bold text-gray-900">Cây Danh Mục Sản Phẩm (Categories Tree)</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Phân loại danh mục đa cấp, định danh nhóm hàng hóa và điều hướng cho toàn bộ sàn WebChicKen.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadCategories}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw style={{ width: 15, height: 15 }} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus style={{ width: 16, height: 16 }} />
              <span>Thêm Danh Mục</span>
            </button>
          </div>
        </div>

        {/* Bento Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng danh mục</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Đang hoạt động</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Layers style={{ width: 24, height: 24 }} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chuẩn phân loại</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Chuẩn 2.0</p>
              <p className="text-xs text-gray-500 mt-1">E-Commerce Taxonomy</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Tag style={{ width: 24, height: 24 }} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kiểm soát an toàn</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Bật</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Quét từ khóa y tế/thuốc</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldCheck style={{ width: 24, height: 24 }} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Khớp bộ lọc</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{filteredCategories.length}</p>
              <p className="text-xs text-gray-500 mt-1">Kết quả hiển thị</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <FolderTree style={{ width: 24, height: 24 }} />
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search style={{ width: 18, height: 18, color: '#9ca3af', position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm danh mục theo tên hoặc mô tả chi tiết..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw style={{ width: 32, height: 32, color: '#6366f1', margin: '0 auto' }} className="animate-spin mb-3" />
              <p className="text-sm text-gray-500">Đang tải cây danh mục từ máy chủ...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-20 text-center">
              <FolderTree style={{ width: 40, height: 40, color: '#9ca3af', margin: '0 auto 12px' }} />
              <p className="text-base font-semibold text-gray-700">Không tìm thấy danh mục nào</p>
              <p className="text-sm text-gray-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc thêm danh mục mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tên Danh Mục</th>
                    <th className="py-3.5 px-4">Mã Phân Loại (ID)</th>
                    <th className="py-3.5 px-4">Mô Tả Chi Tiết</th>
                    <th className="py-3.5 px-4">Ngày Tạo</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {cat.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">{cat.name}</span>
                            <span className="text-xs text-gray-400">Danh mục niêm yết</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {cat.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                        {cat.description || <span className="text-gray-400 italic">Không có mô tả</span>}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar style={{ width: 14, height: 14, color: '#9ca3af' }} />
                          <span>
                            {cat.createdAt
                              ? new Date(cat.createdAt).toLocaleDateString('vi-VN')
                              : 'Hệ thống chuẩn'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Chỉnh sửa danh mục"
                          >
                            <Edit2 style={{ width: 16, height: 16 }} />
                          </button>
                          <button
                            onClick={() => setDeletingId(cat.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa danh mục"
                          >
                            <Trash2 style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tên Danh Mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Nông Sản & Trái Cây, Thiết Bị Điện Tử..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Mô Tả Danh Mục
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả tiêu chuẩn ngành hàng, phạm vi sản phẩm thuộc nhóm này..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <RefreshCw style={{ width: 14, height: 14 }} className="animate-spin" />}
                    <span>{editingCategory ? 'Cập Nhật' : 'Tạo Danh Mục'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto">
                <Trash2 style={{ width: 24, height: 24 }} />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">Xác nhận xóa danh mục</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                >
                  Xóa Ngay
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
