import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Star,
  Tag,
  Settings,
  ArrowUpRight,
  Store,
  MessageSquare,
} from 'lucide-react'
import { PATHS } from '../app/router/paths'

export interface SellerLayoutProps {
  children: React.ReactNode
}

export const SellerLayout: React.FC<SellerLayoutProps> = ({ children }) => {
  const location = useLocation()
  const [storeName] = useState<string>('Chicky Farm Direct')

  const isDashboardActive = location.pathname === '/seller' || location.pathname === '/seller/dashboard'
  const isProductsActive = location.pathname.startsWith('/seller/products')
  const isOrdersActive = location.pathname.startsWith('/seller/orders')
  const isFeedbackActive = location.pathname.startsWith('/seller/feedback')

  return (
    <div className="seller-shell">
      {/* 1. Seller Topbar */}
      <header className="seller-topbar">
        <div className="seller-topbar-left">
          <Link to={PATHS.SELLER.DASHBOARD} className="seller-brand-link">
            <div className="seller-brand-logo">🍗</div>
            <div className="seller-brand-text">
              <span className="seller-brand-title">WebChicKen</span>
              <span className="seller-brand-badge">SELLER CENTER</span>
            </div>
          </Link>
        </div>

        <div className="seller-topbar-right">
          {/* Active Store Indicator */}
          <div className="seller-store-pill">
            <Store style={{ width: 15, height: 15, color: '#f59e0b' }} />
            <span>{storeName}</span>
            <span className="seller-store-status-dot" title="Store is Active & Accepting Orders" />
          </div>

          {/* Switch to Buyer View */}
          <Link to={PATHS.HOME} className="seller-switch-buyer-btn">
            <span>Back to Marketplace</span>
            <ArrowUpRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </header>

      {/* 2. Workspace Body: Sidebar + Main Content */}
      <div className="seller-workspace">
        {/* Left Sidebar */}
        <aside className="seller-sidebar">
          <div>
            {/* Overview & Analytics Group */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Overview & Analytics</div>
              <Link
                to={PATHS.SELLER.DASHBOARD}
                className={`seller-nav-item ${isDashboardActive ? 'active' : ''}`}
              >
                <LayoutDashboard style={{ width: 17, height: 17 }} />
                <span>Dashboard & Analytics</span>
              </Link>
            </div>

            {/* Catalog Group */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Catalog & Products</div>
              <Link
                to={PATHS.SELLER.PRODUCTS}
                className={`seller-nav-item ${isProductsActive ? 'active' : ''}`}
              >
                <Package style={{ width: 17, height: 17 }} />
                <span>My Products</span>
              </Link>

              <div
                className="seller-nav-item"
                style={{ opacity: 0.65, cursor: 'not-allowed' }}
                title="Stock adjustment ledger is synchronized directly in Product Management"
              >
                <Boxes style={{ width: 17, height: 17 }} />
                <span>Inventory & Stocks</span>
                <span className="seller-nav-badge">Auto</span>
              </div>
            </div>

            {/* Orders Group */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Orders & Sales</div>
              <Link
                to={PATHS.SELLER.ORDERS}
                className={`seller-nav-item ${isOrdersActive ? 'active' : ''}`}
              >
                <ShoppingBag style={{ width: 17, height: 17 }} />
                <span>Order Fulfillment</span>
              </Link>
            </div>

            {/* Customer Care & Support Group (TASK-69) */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Customer Care & Support</div>
              <Link
                to={PATHS.SELLER.FEEDBACK}
                className={`seller-nav-item ${isFeedbackActive ? 'active' : ''}`}
              >
                <MessageSquare style={{ width: 17, height: 17 }} />
                <span>Support & Feedback</span>
              </Link>

              <div
                className="seller-nav-item"
                style={{ opacity: 0.65, cursor: 'default' }}
              >
                <Star style={{ width: 17, height: 17 }} />
                <span>Product Reviews</span>
                <span className="seller-nav-badge">Live</span>
              </div>
              <div
                className="seller-nav-item"
                style={{ opacity: 0.65, cursor: 'default' }}
              >
                <Tag style={{ width: 17, height: 17 }} />
                <span>Store Promotions</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer Link */}
          <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <Link
              to={PATHS.ACCOUNT.PROFILE}
              className="seller-nav-item"
              style={{ fontSize: 12.5, color: '#64748b' }}
            >
              <Settings style={{ width: 15, height: 15 }} />
              <span>Seller Account</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="seller-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export default SellerLayout
