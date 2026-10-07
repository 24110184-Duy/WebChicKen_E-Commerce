import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  ShoppingBag,
  Store,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Eye
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import type {
  AdminUserItem,
  AdminUserFilterTab,
  AdminUserRoleFilter,
  BanUserRequest,
  UnbanUserRequest
} from '../../features/admin/types'
import {
  fetchAdminUsers,
  banAdminUser,
  unbanAdminUser
} from '../../features/admin/api/adminUserApi'
import { BanUserModal } from '../../features/admin/components/BanUserModal'
import { UnbanUserModal } from '../../features/admin/components/UnbanUserModal'
import { UserDetailModal } from '../../features/admin/components/UserDetailModal'

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState<AdminUserFilterTab>('ALL')
  const [roleFilter, setRoleFilter] = useState<AdminUserRoleFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(15)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)
  const [isBanOpen, setIsBanOpen] = useState<boolean>(false)
  const [isUnbanOpen, setIsUnbanOpen] = useState<boolean>(false)

  // KPIs
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    customers: 0,
    sellers: 0,
    banned: 0
  })

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAdminUsers({
        page,
        size: pageSize,
        search: searchQuery,
        status: activeTab,
        role: roleFilter
      })
      setUsers(data.items)
      setTotalPages(data.totalPages)
      setTotalCount(data.total)

      // Cập nhật thống kê sơ bộ nếu ở trang 1 và không tìm kiếm
      if (!searchQuery && activeTab === 'ALL' && roleFilter === 'ALL') {
        const allItems = data.items
        setStats({
          total: data.total,
          active: allItems.filter((u) => u.status === 'ACTIVE').length,
          customers: allItems.filter((u) => u.roles.includes('CUSTOMER')).length,
          sellers: allItems.filter((u) => u.roles.includes('SELLER')).length,
          banned: allItems.filter((u) => u.status === 'BANNED' || u.status === 'LOCKED').length
        })
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách người dùng:', err)
      setError(err?.message || 'Không thể tải danh sách tài khoản người dùng.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchQuery, activeTab, roleFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleOpenDetail = (user: AdminUserItem) => {
    setSelectedUser(user)
    setIsDetailOpen(true)
  }

  const handleOpenBan = (user: AdminUserItem) => {
    setSelectedUser(user)
    setIsBanOpen(true)
  }

  const handleOpenUnban = (user: AdminUserItem) => {
    setSelectedUser(user)
    setIsUnbanOpen(true)
  }

  const handleConfirmBan = async (userId: string, request: BanUserRequest) => {
    const res = await banAdminUser(userId, request)
    showToast(res.message || 'Đã khóa tài khoản thành công!')
    await loadUsers()
  }

  const handleConfirmUnban = async (userId: string, request: UnbanUserRequest) => {
    const res = await unbanAdminUser(userId, request)
    showToast(res.message || 'Đã mở khóa tài khoản thành công!')
    await loadUsers()
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
              fontSize: 14
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Header & Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                <Users size={20} />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                Quản lý Người dùng & Khóa Tài khoản
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#4338ca',
                  backgroundColor: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  padding: '2px 8px',
                  borderRadius: 6
                }}
              >
                TASK-66
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
              Giám sát danh bạ thành viên, phân quyền vai trò và áp dụng chế tài thu hồi phiên làm việc tức thì khi có vi phạm.
            </p>
          </div>

          <button
            onClick={() => loadUsers()}
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
              gap: 6
            }}
          >
            <RotateCcw size={14} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* 2. Bento KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24
          }}
        >
          {/* Card 1: Tổng người dùng */}
          <div
            onClick={() => {
              setActiveTab('ALL')
              setRoleFilter('ALL')
            }}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: activeTab === 'ALL' && roleFilter === 'ALL' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>TỔNG THÀNH VIÊN</span>
              <Users size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
              {stats.total || totalCount}
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Toàn bộ tài khoản sàn</span>
          </div>

          {/* Card 2: Khách hàng */}
          <div
            onClick={() => {
              setRoleFilter('CUSTOMER')
            }}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: roleFilter === 'CUSTOMER' ? '2px solid #10b981' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>KHÁCH HÀNG (BUYERS)</span>
              <ShoppingBag size={18} color="#059669" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 8 }}>
              {stats.customers}
            </div>
            <span style={{ fontSize: 12, color: '#047857' }}>Người mua gà sạch</span>
          </div>

          {/* Card 3: Nhà bán */}
          <div
            onClick={() => {
              setRoleFilter('SELLER')
            }}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: roleFilter === 'SELLER' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>GIAN HÀNG (SELLERS)</span>
              <Store size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 8 }}>
              {stats.sellers}
            </div>
            <span style={{ fontSize: 12, color: '#b45309' }}>Trang trại VietGAP</span>
          </div>

          {/* Card 4: Bị cấm */}
          <div
            onClick={() => {
              setActiveTab('BANNED')
            }}
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: activeTab === 'BANNED' ? '2px solid #ef4444' : '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>TÀI KHOẢN BỊ CẤM</span>
              <Lock size={18} color="#dc2626" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', marginTop: 8 }}>
              {stats.banned}
            </div>
            <span style={{ fontSize: 12, color: '#b91c1c' }}>Thu hồi phiên tức thì</span>
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
            marginBottom: 20
          }}
        >
          {/* Search + Role Dropdown */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 460 }}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="Tìm theo họ tên, email, số điện thoại, gian hàng..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  width: '100%',
                  color: '#0f172a'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as AdminUserRoleFilter)
                  setPage(1)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="CUSTOMER">👤 Khách hàng (Buyer)</option>
                <option value="SELLER">🏪 Nhà bán hàng (Seller)</option>
                <option value="ADMIN">🛡️ Quản trị viên (Admin)</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto'
            }}
          >
            {[
              { id: 'ALL', label: 'Tất cả trạng thái' },
              { id: 'ACTIVE', label: '🟢 Đang hoạt động' },
              { id: 'BANNED', label: '🔴 Đang bị cấm' },
              { id: 'LOCKED', label: '🟡 Tạm khóa bảo mật' }
            ].map((tab) => {
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as AdminUserFilterTab)
                    setPage(1)
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#ffffff' : '#64748b',
                    backgroundColor: isSelected ? '#0f172a' : 'transparent',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. Data Table */}
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
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#0284c7',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px auto'
                }}
              />
              <p style={{ margin: 0, fontSize: 13 }}>Đang tải danh sách tài khoản người dùng...</p>
            </div>
          ) : error ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#dc2626' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{error}</p>
              <button
                onClick={() => loadUsers()}
                style={{
                  marginTop: 12,
                  padding: '6px 16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecdd3',
                  borderRadius: 6,
                  color: '#b91c1c',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Thử lại
              </button>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
              <Users size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#475569' }}>
                Không tìm thấy tài khoản người dùng nào
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                Vui lòng thử tìm kiếm với từ khóa khác hoặc bỏ các bộ lọc
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 20px' }}>Người dùng</th>
                    <th style={{ padding: '14px 20px' }}>Liên hệ</th>
                    <th style={{ padding: '14px 20px' }}>Vai trò</th>
                    <th style={{ padding: '14px 20px' }}>Trạng thái</th>
                    <th style={{ padding: '14px 20px' }}>Ngày tham gia</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isBanned = u.status === 'BANNED'
                    const isLocked = u.status === 'LOCKED'

                    return (
                      <tr
                        key={u.userId}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.1s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Người dùng */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: '#e2e8f0',
                                border: '1px solid #cbd5e1',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                color: '#475569',
                                flexShrink: 0
                              }}
                            >
                              {u.logoUrl ? (
                                <img src={u.logoUrl} alt={u.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                u.fullName.charAt(0)
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{u.fullName}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748b' }}>{u.email}</p>
                              {u.storeName && (
                                <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                                  🏪 {u.storeName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Liên hệ */}
                        <td style={{ padding: '14px 20px', color: '#475569' }}>
                          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>{u.phone || '—'}</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                            {u.userId.slice(0, 12)}...
                          </p>
                        </td>

                        {/* Vai trò */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {u.roles.map((r) => (
                              <span
                                key={r}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  backgroundColor: r === 'SUPER_ADMIN' || r === 'ADMIN' ? '#f5f3ff' : r === 'SELLER' ? '#fef3c7' : '#eff6ff',
                                  color: r === 'SUPER_ADMIN' || r === 'ADMIN' ? '#6d28d9' : r === 'SELLER' ? '#b45309' : '#1d4ed8',
                                  border: r === 'SUPER_ADMIN' || r === 'ADMIN' ? '1px solid #ddd6fe' : r === 'SELLER' ? '1px solid #fde68a' : '1px solid #bfdbfe'
                                }}
                              >
                                {r === 'SUPER_ADMIN' ? 'Admin' : r === 'SELLER' ? 'Người bán' : 'Khách hàng'}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 12,
                              backgroundColor: u.status === 'ACTIVE' ? '#ecfdf5' : isBanned ? '#fff1f2' : '#fffbeb',
                              color: u.status === 'ACTIVE' ? '#047857' : isBanned ? '#be123c' : '#b45309',
                              border: u.status === 'ACTIVE' ? '1px solid #a7f3d0' : isBanned ? '1px solid #fecdd3' : '1px solid #fde68a'
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: u.status === 'ACTIVE' ? '#10b981' : isBanned ? '#f43f5e' : '#f59e0b'
                              }}
                            />
                            <span>{u.status === 'ACTIVE' ? 'Hoạt động' : isBanned ? 'Bị cấm' : 'Tạm khóa'}</span>
                          </span>
                        </td>

                        {/* Ngày tạo */}
                        <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 12 }}>
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                              onClick={() => handleOpenDetail(u)}
                              style={{
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#334155',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Eye size={13} />
                              <span>Chi tiết</span>
                            </button>

                            {isBanned || isLocked ? (
                              <button
                                onClick={() => handleOpenUnban(u)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#ffffff',
                                  backgroundColor: '#059669',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Unlock size={13} />
                                <span>Mở khóa</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenBan(u)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#be123c',
                                  backgroundColor: '#fff1f2',
                                  border: '1px solid #fecdd3',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Lock size={13} />
                                <span>Khóa nick</span>
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

          {/* Phân trang */}
          {totalPages > 1 && (
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
                color: '#64748b'
              }}
            >
              <span>Trang {page} / {totalPages} (Tổng cộng {totalCount} tài khoản)</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: page <= 1 ? 0.5 : 1
                  }}
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages ? 0.5 : 1
                  }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <UserDetailModal
          user={selectedUser}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onOpenBanModal={handleOpenBan}
          onOpenUnbanModal={handleOpenUnban}
        />

        <BanUserModal
          user={selectedUser}
          isOpen={isBanOpen}
          onClose={() => setIsBanOpen(false)}
          onConfirm={handleConfirmBan}
        />

        <UnbanUserModal
          user={selectedUser}
          isOpen={isUnbanOpen}
          onClose={() => setIsUnbanOpen(false)}
          onConfirm={handleConfirmUnban}
        />
      </div>
    </AdminLayout>
  )
}
export default AdminUsersPage
