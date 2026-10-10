import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  Package,
  Store,
  ChevronDown,
  Settings,
  LogOut,
  ArrowUpRight,
  Grid,
  Bell,
} from 'lucide-react'
import { PATHS } from '../app/router/paths'
import { sellerApi } from '../features/seller/api/sellerApi'
import { useAuthStore } from '../app/store/authStore'
import { authApi } from '../features/auth/api/authApi'
import { cartStore } from '../app/store/cartStore'

export interface SellerLayoutProps {
  children: React.ReactNode
}

export const SellerLayout: React.FC<SellerLayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [storeName, setStoreName] = useState<string>('sellershopname')
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sellerApi.getMyStore().then((store) => {
      if (store?.storeName) {
        setStoreName(store.storeName)
      } else if (user?.id) {
        const cached = localStorage.getItem(`seller_store_${user.id}`)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (parsed.storeName) setStoreName(parsed.storeName)
            return
          } catch {}
        }
        setStoreName(user.username || user.fullName || 'sellershopname')
      }
    }).catch(() => {
      if (user?.id) {
        const cached = localStorage.getItem(`seller_store_${user.id}`)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (parsed.storeName) setStoreName(parsed.storeName)
          } catch {}
        }
      }
    })
  }, [user])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    cartStore.resetCart()
    logout()
    navigate(PATHS.HOME, { replace: true })
  }

  // Active check for 4 UI tabs & their sub-links
  const searchParams = new URLSearchParams(location.search)
  const tabParam = searchParams.get('tab')
  const actionParam = searchParams.get('action')

  const isOverviewActive = location.pathname === '/seller' || location.pathname === '/seller/dashboard'
  const isShipmentActive = location.pathname.startsWith('/seller/shipment') && !tabParam
  const isMassShipActive = location.pathname.startsWith('/seller/shipment') && tabParam === 'MASS_SHIP'
  const isShippingSettingActive = location.pathname.startsWith('/seller/shipment') && tabParam === 'SETTING'

  const isOrderActive = location.pathname.startsWith('/seller/orders') && !tabParam
  const isCancellationActive = location.pathname.startsWith('/seller/orders') && tabParam === 'CANCELLATION'
  const isReturnRefundActive = location.pathname.startsWith('/seller/orders') && tabParam === 'RETURN_REFUND'

  const isProductActive = location.pathname.startsWith('/seller/products') && !tabParam && !actionParam
  const isAddProductActive = location.pathname.startsWith('/seller/products') && actionParam === 'new'
  const isViolationActive = location.pathname.startsWith('/seller/products') && tabParam === 'VIOLATION'

  const initials = (storeName[0] || 'S').toUpperCase()

  return (
    <div className="seller-shell">
      {/* ── 1. Topbar Shopee Seller Centre Style ── */}
      <header className="seller-topbar">
        <div className="seller-topbar-left">
          <Link to={PATHS.SELLER.DASHBOARD} className="seller-brand-link">
            <div className="seller-brand-logo">🍗</div>
            <div className="seller-brand-text">
              <span className="seller-brand-title">ChickyMart</span>
              <span className="seller-brand-badge">SELLER CENTRE</span>
            </div>
          </Link>
        </div>

        <div className="seller-topbar-right">
          {/* Quick utility icons */}
          <button
            type="button"
            className="seller-icon-btn"
            title="Apps"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6 }}
          >
            <Grid style={{ width: 18, height: 18 }} />
          </button>
          <button
            type="button"
            className="seller-icon-btn"
            title="Chat & Notifications"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6 }}
          >
            <Bell style={{ width: 18, height: 18 }} />
          </button>

          {/* User profile dropdown (Ảnh 1) */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {initials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {storeName}
              </span>
              <ChevronDown style={{ width: 14, height: 14, color: '#94a3b8' }} />
            </div>

            {/* Dropdown Card (Khoanh đỏ trong Ảnh 1) */}
            {userDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 220,
                  backgroundColor: '#ffffff',
                  borderRadius: 10,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                  padding: '8px 0',
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{storeName}</div>
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>● Shop Active</div>
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <div
                    style={{ padding: '9px 16px', fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => { setUserDropdownOpen(false); navigate(PATHS.SELLER.DASHBOARD) }}
                  >
                    <Store style={{ width: 15, height: 15, color: '#64748b' }} />
                    <span>Shop Information</span>
                  </div>

                  {/* Khoanh đỏ trong ảnh 1: Shop Setting */}
                  <div
                    style={{
                      padding: '9px 16px',
                      fontSize: 13,
                      color: '#854d0e',
                      backgroundColor: '#fef9c3',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => { setUserDropdownOpen(false); navigate(`${PATHS.SELLER.SHIPMENT}?tab=SETTING`) }}
                  >
                    <Settings style={{ width: 15, height: 15, color: '#ca8a04' }} />
                    <span>Shop Setting</span>
                  </div>

                  <Link
                    to={PATHS.HOME}
                    style={{
                      padding: '9px 16px',
                      fontSize: 13,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textDecoration: 'none',
                    }}
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <ArrowUpRight style={{ width: 15, height: 15, color: '#64748b' }} />
                    <span>Back to Marketplace</span>
                  </Link>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 4 }}>
                  <div
                    style={{ padding: '9px 16px', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={handleLogout}
                  >
                    <LogOut style={{ width: 15, height: 15, color: '#dc2626' }} />
                    <span>Logout</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Workspace Body: 4 Tabs Sidebar + Main Content ── */}
      <div className="seller-workspace">
        {/* Left Sidebar: CHỈ GIỮ ĐÚNG 4 MỤC NHƯ ẢNH YÊU CẦU */}
        <aside className="seller-sidebar">
          <div>
            {/* 1. OVERVIEW */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Overview</div>
              <Link
                to={PATHS.SELLER.DASHBOARD}
                className={`seller-nav-item ${isOverviewActive ? 'active' : ''}`}
              >
                <LayoutDashboard style={{ width: 17, height: 17 }} />
                <span>Overview (Dashboard)</span>
              </Link>
            </div>

            {/* 2. SHIPMENT (Ảnh 2) */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Shipment</div>
              <Link
                to={PATHS.SELLER.SHIPMENT}
                className={`seller-nav-item ${isShipmentActive ? 'active' : ''}`}
              >
                <Truck style={{ width: 17, height: 17 }} />
                <span>My Shipment</span>
              </Link>
              <Link
                to={`${PATHS.SELLER.SHIPMENT}?tab=MASS_SHIP`}
                className={`seller-nav-item ${isMassShipActive ? 'active' : ''}`}
                style={{ paddingLeft: 34, fontSize: 12.5 }}
              >
                <span>Mass Ship</span>
              </Link>
              <Link
                to={`${PATHS.SELLER.SHIPMENT}?tab=SETTING`}
                className={`seller-nav-item ${isShippingSettingActive ? 'active' : ''}`}
                style={{ paddingLeft: 34, fontSize: 12.5 }}
              >
                <span>Shipping Setting</span>
              </Link>
            </div>

            {/* 3. ORDER (Ảnh 3) */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Order</div>
              <Link
                to={PATHS.SELLER.ORDERS}
                className={`seller-nav-item ${isOrderActive ? 'active' : ''}`}
              >
                <ClipboardList style={{ width: 17, height: 17 }} />
                <span>My Orders</span>
              </Link>
              <Link
                to={`${PATHS.SELLER.ORDERS}?tab=CANCELLATION`}
                className={`seller-nav-item ${isCancellationActive ? 'active' : ''}`}
                style={{ paddingLeft: 34, fontSize: 12.5 }}
              >
                <span>Cancellation</span>
              </Link>
              <Link
                to={`${PATHS.SELLER.ORDERS}?tab=RETURN_REFUND`}
                className={`seller-nav-item ${isReturnRefundActive ? 'active' : ''}`}
                style={{ paddingLeft: 34, fontSize: 12.5 }}
              >
                <span>Return/Refund</span>
              </Link>
            </div>

            {/* 4. PRODUCT (Ảnh 4) */}
            <div className="seller-nav-group">
              <div className="seller-nav-group-title">Product</div>
              <Link
                to={PATHS.SELLER.PRODUCTS}
                className={`seller-nav-item ${isProductActive ? 'active' : ''}`}
              >
                <Package style={{ width: 17, height: 17 }} />
                <span>My Products</span>
              </Link>
              <Link
                to={`${PATHS.SELLER.PRODUCTS}?action=new`}
                className={`seller-nav-item ${isAddProductActive ? 'active' : ''}`}
                style={{ paddingLeft: 34, fontSize: 12.5 }}
              >
                <span>Add New Product</span>
              </Link>
              <Link
                to={`${PATHS.SELLER.PRODUCTS}?tab=VIOLATION`}
                className={`seller-nav-item ${isViolationActive ? 'active' : ''}`}
                style={{ paddingLeft: 34, fontSize: 12.5 }}
              >
                <span>Product Violations</span>
              </Link>
            </div>
          </div>

          {/* Quick link bottom */}
          <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <Link
              to={PATHS.HOME}
              className="seller-nav-item"
              style={{ fontSize: 12.5, color: '#64748b' }}
            >
              <ArrowUpRight style={{ width: 15, height: 15 }} />
              <span>Back to Marketplace</span>
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
