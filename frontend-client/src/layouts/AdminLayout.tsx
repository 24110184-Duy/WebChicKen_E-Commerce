import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  Users,
  ScrollText,
  FolderTree,
  ShoppingBag,
  Percent,
  Settings,
  ArrowUpRight,
  Shield,
  Layers,
  MessageSquare,
} from 'lucide-react'
import { useAuthStore } from '../app/store/authStore'
import { PATHS } from '../app/router/paths'
import { adminProductApi } from '../features/admin/api/adminProductApi'
import { adminShopApi } from '../features/admin/api/adminShopApi'

export interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation()
  const { user } = useAuthStore()
  const [pendingProductsCount, setPendingProductsCount] = React.useState<number>(0)
  const [pendingShopsCount, setPendingShopsCount] = React.useState<number>(0)

  const loadPendingCounts = React.useCallback(async () => {
    try {
      const [prodsRes, shopsRes] = await Promise.allSettled([
        adminProductApi.getProducts({ size: 100 }),
        adminShopApi.getApplications('PENDING'),
      ])

      if (prodsRes.status === 'fulfilled') {
        const items = prodsRes.value.items || []
        const count = items.filter((p) => p.status === 'PENDING_APPROVAL').length
        setPendingProductsCount(count)
      }

      if (shopsRes.status === 'fulfilled') {
        const apps = shopsRes.value || []
        const count = apps.filter((a) => a.status === 'PENDING').length
        setPendingShopsCount(count)
      }
    } catch {
      // Bỏ qua lỗi kết nối tạm thời
    }
  }, [])

  React.useEffect(() => {
    loadPendingCounts()

    const handleRefresh = () => {
      loadPendingCounts()
    }

    const handleProductCount = (e: Event) => {
      const custom = e as CustomEvent<{ count: number }>
      if (typeof custom.detail?.count === 'number') {
        setPendingProductsCount(custom.detail.count)
      } else {
        loadPendingCounts()
      }
    }

    const handleShopCount = (e: Event) => {
      const custom = e as CustomEvent<{ count: number }>
      if (typeof custom.detail?.count === 'number') {
        setPendingShopsCount(custom.detail.count)
      } else {
        loadPendingCounts()
      }
    }

    window.addEventListener('admin:refresh-badges', handleRefresh)
    window.addEventListener('admin:pending-products-updated', handleProductCount)
    window.addEventListener('admin:pending-shops-updated', handleShopCount)

    return () => {
      window.removeEventListener('admin:refresh-badges', handleRefresh)
      window.removeEventListener('admin:pending-products-updated', handleProductCount)
      window.removeEventListener('admin:pending-shops-updated', handleShopCount)
    }
  }, [loadPendingCounts, location.pathname])

  const adminName = user?.fullName || user?.email || user?.username || 'Quản Trị Viên'
  const adminRole = user?.roles.find(r => ['SUPER_ADMIN', 'MODERATOR'].includes(r)) || 'SUPER_ADMIN'
  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'AD'

  // Active check helpers matching routes accurately
  const isDashboardActive = location.pathname === '/admin' || location.pathname === '/admin/dashboard'
  const isOrdersActive = location.pathname.startsWith('/admin/orders')
  const isProductsActive = location.pathname.startsWith('/admin/products')
  const isCategoriesActive = location.pathname.startsWith('/admin/categories')
  const isShopsActive = location.pathname.startsWith('/admin/shops') || location.pathname.startsWith('/admin/sellers')
  const isVouchersActive = location.pathname.startsWith('/admin/vouchers')
  const isFeedbacksActive = location.pathname.startsWith('/admin/feedbacks') || location.pathname.startsWith('/admin/feedback')
  const isUsersActive = location.pathname.startsWith('/admin/users')
  const isAuditLogsActive = location.pathname.startsWith('/admin/audit-logs')
  const isSettingsActive = location.pathname.startsWith('/admin/settings')

  return (
    <div className="admin-shell">
      {/* 1. Admin Topbar */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <Link to={PATHS.ADMIN.DASHBOARD} className="admin-brand-link">
            <div className="admin-brand-logo">
              <Shield style={{ width: 20, height: 20, color: '#f59e0b' }} />
            </div>
            <div className="admin-brand-text">
              <span className="admin-brand-title">
                WebChicKen
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#7c3aed',
                    backgroundColor: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  PRO
                </span>
              </span>
              <span className="admin-brand-badge">BACKOFFICE CONTROL CENTER</span>
            </div>
          </Link>

          {/* System Health Indicator */}
          <div className="admin-system-health-pill">
            <span className="admin-pulse-dot" />
            <span>Core Engine: Healthy • 99.98% SLA</span>
          </div>
        </div>

        <div className="admin-topbar-right">
          {/* Admin Operator Info */}
          <div className="admin-operator-pill">
            <div className="admin-operator-avatar">{initials}</div>
            <span className="admin-operator-name">{adminName}</span>
            <span className="admin-role-tag">{adminRole}</span>
          </div>

          {/* Shortcut to Seller Center */}
          <Link to={PATHS.SELLER.DASHBOARD} className="admin-switch-btn" title="Open Seller Portal">
            <Layers style={{ width: 14, height: 14, color: '#d97706' }} />
            <span>Seller Center</span>
          </Link>

          {/* Switch to Public Marketplace */}
          <Link to={PATHS.HOME} className="admin-switch-btn" title="Open Public Marketplace">
            <span>Marketplace</span>
            <ArrowUpRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </header>

      {/* 2. Workspace: Sidebar + Main Content */}
      <div className="admin-workspace">
        {/* Left Dark Sidebar */}
        <aside className="admin-sidebar">
          <div>
            {/* 1. OVERVIEW */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Overview</div>
              <Link
                to={PATHS.ADMIN.DASHBOARD}
                className={`admin-nav-item ${isDashboardActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <LayoutDashboard style={{ width: 17, height: 17 }} />
                  <span>Overview (Dashboard)</span>
                </div>
              </Link>
            </div>

            {/* 2. ORDER */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Order</div>
              <Link
                to={PATHS.ADMIN.ORDERS}
                className={`admin-nav-item ${isOrdersActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <ShoppingBag style={{ width: 17, height: 17 }} />
                  <span>Platform Orders</span>
                </div>
              </Link>
            </div>

            {/* 3. PRODUCT & CATALOG */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Product & Catalog</div>
              <Link
                to={PATHS.ADMIN.PRODUCTS}
                className={`admin-nav-item ${isProductsActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <ShieldCheck style={{ width: 17, height: 17 }} />
                  <span>Product Moderation</span>
                </div>
                {pendingProductsCount > 0 && (
                  <span className="admin-nav-badge" title="Sản phẩm chờ quản trị viên kiểm duyệt">
                    {pendingProductsCount}
                  </span>
                )}
              </Link>

              <Link
                to={PATHS.ADMIN.CATEGORIES}
                className={`admin-nav-item ${isCategoriesActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <FolderTree style={{ width: 17, height: 17 }} />
                  <span>Categories Tree</span>
                </div>
              </Link>
            </div>

            {/* 4. SHOP / MERCHANT */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Shop Management</div>
              <Link
                to={PATHS.ADMIN.SHOPS}
                className={`admin-nav-item ${isShopsActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Store style={{ width: 17, height: 17 }} />
                  <span>Shop Approvals</span>
                </div>
                {pendingShopsCount > 0 && (
                  <span className="admin-nav-badge" title="Hồ sơ gian hàng chờ xét duyệt">
                    {pendingShopsCount}
                  </span>
                )}
              </Link>
            </div>

            {/* 5. MARKETING CENTRE */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Marketing Centre</div>
              <Link
                to={PATHS.ADMIN.VOUCHERS}
                className={`admin-nav-item ${isVouchersActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Percent style={{ width: 17, height: 17 }} />
                  <span>Platform Vouchers</span>
                </div>
              </Link>
            </div>

            {/* 6. CUSTOMER SERVICE */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Customer Service</div>
              <Link
                to={PATHS.ADMIN.FEEDBACKS}
                className={`admin-nav-item ${isFeedbacksActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <MessageSquare style={{ width: 17, height: 17 }} />
                  <span>User Feedback</span>
                </div>
                <span
                  className="admin-nav-badge"
                  style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                  title="User Inquiries & Complaints"
                >
                  Hot
                </span>
              </Link>
            </div>

            {/* 7. ACCOUNTS & SECURITY */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Accounts & Security</div>
              <Link
                to={PATHS.ADMIN.USERS}
                className={`admin-nav-item ${isUsersActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Users style={{ width: 17, height: 17 }} />
                  <span>Users & Role Bans</span>
                </div>
              </Link>

              <Link
                to={PATHS.ADMIN.AUDIT_LOGS}
                className={`admin-nav-item ${isAuditLogsActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <ScrollText style={{ width: 17, height: 17 }} />
                  <span>Audit Trail Ledger</span>
                </div>
              </Link>
            </div>

            {/* 8. SYSTEM */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">System Settings</div>
              <Link
                to={PATHS.ADMIN.SETTINGS}
                className={`admin-nav-item ${isSettingsActive ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Settings style={{ width: 17, height: 17 }} />
                  <span>System Configuration</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Sidebar Footer Link - Back to Marketplace (như Seller) */}
          <div className="admin-sidebar-footer">
            <Link
              to={PATHS.HOME}
              className="admin-nav-item"
              style={{ fontSize: 13, color: '#94a3b8' }}
              title="Quay lại sàn mua sắm ChickyMart"
            >
              <div className="admin-nav-item-content">
                <ArrowUpRight style={{ width: 16, height: 16 }} />
                <span>Back to Marketplace</span>
              </div>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
