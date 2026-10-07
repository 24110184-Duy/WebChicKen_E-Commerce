import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  Users,
  ScrollText,
  FolderTree,
  Tag,
  ShoppingBag,
  Percent,
  Star,
  Settings,
  ArrowUpRight,
  Shield,
  Layers,
  MessageSquare,
} from 'lucide-react'
import { PATHS } from '../app/router/paths'

export interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation()
  const [adminName] = useState<string>('Nguyen Admin')
  const [adminRole] = useState<'SUPER_ADMIN' | 'MODERATOR'>('SUPER_ADMIN')

  // Helper function to check active path
  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

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
            <div className="admin-operator-avatar">AD</div>
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
            {/* Overview Group */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Platform Intelligence</div>
              <Link
                to={PATHS.ADMIN.DASHBOARD}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.DASHBOARD, true) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <LayoutDashboard style={{ width: 17, height: 17 }} />
                  <span>Overview & Metrics</span>
                </div>
              </Link>
            </div>

            {/* Governance & Moderation Group (TASK-64, TASK-65, TASK-69) */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Governance & Approvals</div>
              <Link
                to={PATHS.ADMIN.SHOPS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.SHOPS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Store style={{ width: 17, height: 17 }} />
                  <span>Shop Approvals</span>
                </div>
                <span className="admin-nav-badge" title="Pending Seller Applications">
                  3
                </span>
              </Link>

              <Link
                to={PATHS.ADMIN.PRODUCTS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.PRODUCTS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <ShieldCheck style={{ width: 17, height: 17 }} />
                  <span>Product Moderation</span>
                </div>
                <span className="admin-nav-badge" title="Pending Product Quality Approvals">
                  5
                </span>
              </Link>

              <Link
                to={PATHS.ADMIN.FEEDBACKS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.FEEDBACKS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <MessageSquare style={{ width: 17, height: 17 }} />
                  <span>Seller Feedback</span>
                </div>
                <span
                  className="admin-nav-badge"
                  style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                  title="Seller Inquiries & Complaints"
                >
                  Hot
                </span>
              </Link>
            </div>

            {/* User Security & Audit (TASK-66, TASK-67) */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Security & Accounts</div>
              <Link
                to={PATHS.ADMIN.USERS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.USERS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Users style={{ width: 17, height: 17 }} />
                  <span>Users & Role Bans</span>
                </div>
              </Link>

              <Link
                to={PATHS.ADMIN.AUDIT_LOGS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.AUDIT_LOGS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <ScrollText style={{ width: 17, height: 17 }} />
                  <span>Audit Trail Ledger</span>
                </div>
              </Link>
            </div>

            {/* Marketplace Operations Group */}
            <div className="admin-nav-group">
              <div className="admin-nav-group-title">Marketplace Operations</div>
              <Link
                to={PATHS.ADMIN.CATEGORIES}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.CATEGORIES) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <FolderTree style={{ width: 17, height: 17 }} />
                  <span>Categories Tree</span>
                </div>
              </Link>

              <Link
                to={PATHS.ADMIN.BRANDS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.BRANDS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Tag style={{ width: 17, height: 17 }} />
                  <span>Brands & Farms</span>
                </div>
              </Link>

              <Link
                to={PATHS.ADMIN.ORDERS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.ORDERS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <ShoppingBag style={{ width: 17, height: 17 }} />
                  <span>Platform Orders</span>
                </div>
              </Link>

              <Link
                to={PATHS.ADMIN.VOUCHERS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.VOUCHERS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Percent style={{ width: 17, height: 17 }} />
                  <span>Platform Vouchers</span>
                </div>
              </Link>

              <Link
                to={PATHS.ADMIN.REVIEWS}
                className={`admin-nav-item ${isActive(PATHS.ADMIN.REVIEWS) ? 'active' : ''}`}
              >
                <div className="admin-nav-item-content">
                  <Star style={{ width: 17, height: 17 }} />
                  <span>Reviews Monitor</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Sidebar Footer Link */}
          <div className="admin-sidebar-footer">
            <Link
              to={PATHS.ADMIN.SETTINGS}
              className={`admin-nav-item ${isActive(PATHS.ADMIN.SETTINGS) ? 'active' : ''}`}
              style={{ fontSize: 13 }}
            >
              <div className="admin-nav-item-content">
                <Settings style={{ width: 16, height: 16 }} />
                <span>System Configuration</span>
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
