import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { WebChicKenLogo } from '../features/auth/components/WebChicKenLogo'
import { useAuthStore } from '../app/store/authStore'
import { useCartStore, cartStore } from '../app/store/cartStore'
import { authApi } from '../features/auth/api/authApi'
import { PATHS } from '../app/router/paths'
import { catalogApi } from '../features/catalog/api/catalogApi'
import type { Category } from '../features/catalog/types/catalogTypes'

interface StorefrontLayoutProps {
  children: React.ReactNode
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isSeller, logout } = useAuthStore()
  const { totalQuantity } = useCartStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  React.useEffect(() => {
    catalogApi.getCategories().then(setCategories)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/search')
    }
  }

  const handleSellerCenterClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate(PATHS.LOGIN, { state: { from: PATHS.SELLER.DASHBOARD } })
      return
    }
    if (isSeller) {
      navigate(PATHS.SELLER.DASHBOARD)
    } else {
      navigate(PATHS.SELLER.REGISTER)
    }
  }

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    cartStore.resetCart()
    logout()
    navigate(PATHS.HOME, { replace: true })
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? user?.phone?.[0] ?? 'U'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* 1. Top Announcement Bar */}
      <div className="storefront-top-strip">
        <div className="storefront-top-inner">
          <div>
            <span>Chào mừng bạn đến với ChickyMart — Sàn Thương Mại Điện Tử Trực Tuyến Đa Ngành</span>
            <span style={{ margin: '0 10px', opacity: 0.4 }}>|</span>
            <span style={{ color: '#facc15', fontWeight: 700 }}>Miễn phí vận chuyển toàn quốc cho đơn hàng từ 150.000₫</span>
          </div>
          <div className="storefront-top-links">
            <button
              type="button"
              onClick={handleSellerCenterClick}
              className="storefront-top-link"
              style={{ background: 'none', border: 'none', cursor: 'padding', padding: 0, font: 'inherit' }}
            >
              Seller Center
            </button>
            <span style={{ opacity: 0.3 }}>|</span>
            <Link to={PATHS.ACCOUNT.NOTIFICATIONS} className="storefront-top-link">Notifications</Link>
            <span style={{ opacity: 0.3 }}>|</span>
            <span style={{ color: '#cbd5e1' }}>Hotline: 1900-CHICKY</span>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Header */}
      <header className="storefront-header">
        <div className="storefront-header-inner">
          {/* Logo */}
          <Link to={PATHS.HOME} className="storefront-brand">
            <WebChicKenLogo size="md" />
            <div>
              <div className="storefront-brand-text">ChickyMart</div>
              <div className="storefront-brand-sub">Online Shopping Marketplace</div>
            </div>
          </Link>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="storefront-search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu, điện tử, thời trang, đời sống..."
              className="storefront-search-input"
            />
            <button type="submit" className="storefront-search-btn">
              Search
            </button>
          </form>

          {/* Right Header Actions */}
          <div className="storefront-header-actions">
            {/* Cart Widget */}
            <Link
              to={PATHS.CART}
              className="storefront-cart-btn"
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault()
                  navigate(PATHS.LOGIN, { state: { from: PATHS.CART } })
                }
              }}
            >
              <span>Cart</span>
              {isAuthenticated && totalQuantity > 0 && (
                <span className="storefront-cart-badge">{totalQuantity}</span>
              )}
            </Link>

            {/* User Account / Auth buttons */}
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to={PATHS.ACCOUNT.PROFILE} className="storefront-user-btn">
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#fef3c7',
                    color: '#92400e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                  }}>
                    {initials}
                  </span>
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName || user.username || (user.email ? user.email.split('@')[0] : user.phone) || 'User'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(15, 23, 42, 0.08)',
                    border: 'none',
                    color: '#0f172a',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link
                  to={PATHS.LOGIN}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#0f172a',
                    textDecoration: 'none',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to={PATHS.REGISTER}
                  style={{
                    padding: '8px 16px',
                    background: '#0f172a',
                    color: '#ffffff',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. Horizontal Category Bar */}
      <nav className="storefront-cat-bar">
        <div className="storefront-cat-inner">
          <Link
            to="/search"
            className={`storefront-cat-link ${location.pathname === '/search' && !location.search ? 'active' : ''}`}
          >
            All Products
          </Link>
          {categories.map(cat => {
            const isActive = location.search.includes(`categoryId=${cat.id}`)
            return (
              <Link
                key={cat.id}
                to={`/search?categoryId=${cat.id}`}
                className={`storefront-cat-link ${isActive ? 'active' : ''}`}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 4. Page Content Slot */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* 5. Storefront Footer */}
      <footer className="storefront-footer">
        <div className="footer-inner">
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', marginBottom: 12 }}>
              ChickyMart — Online E-Commerce Marketplace
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#94a3b8', maxWidth: 360 }}>
              Nền tảng mua sắm trực tuyến hàng đầu, kết nối người mua và nhà bán uy tín. Đa dạng danh mục: Thiết bị điện tử, Thời trang, Đời sống, Sức khỏe sắc đẹp với chính sách bảo vệ người mua toàn diện.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Customer Care</div>
            <ul className="footer-links">
              <li><Link to={PATHS.ACCOUNT.PROFILE} className="footer-link">Help Center</Link></li>
              <li><Link to={PATHS.ACCOUNT.ORDERS} className="footer-link">How to Buy</Link></li>
              <li><Link to={PATHS.ACCOUNT.ORDERS} className="footer-link">Shipping & Delivery</Link></li>
              <li><Link to={PATHS.ACCOUNT.ORDERS} className="footer-link">Return & Refund</Link></li>
              <li><Link to={PATHS.ACCOUNT.NOTIFICATIONS} className="footer-link">Contact Customer Support</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Về WebChicKen</div>
            <ul className="footer-links">
              <li><span className="footer-link">Giới Thiệu Sàn</span></li>
              <li><span className="footer-link">Đối Tác & Thương Hiệu</span></li>
              <li><span className="footer-link">Chính Sách Hàng Chính Hãng</span></li>
              <li><span className="footer-link">Chính Sách Bảo Mật</span></li>
              <li><span className="footer-link">Điều Khoản Dịch Vụ</span></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Payment & Security</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#94a3b8', marginBottom: 14 }}>
              Secure payment via ATM Cards, Visa, MasterCard, and Cash on Delivery (COD).
            </p>
            <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.08)', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#fde68a', fontWeight: 700 }}>
              100% Cam Kết Hàng Chính Hãng & Bảo Vệ Người Mua
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; 2026 ChickyMart E-Commerce Marketplace. All rights reserved. Built with Java Servlet 6.0 & React SPA.
        </div>
      </footer>
    </div>
  )
}
