import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../app/store/authStore'
import { useAccountNav } from '../app/store/accountNavStore'
import { cartStore } from '../app/store/cartStore'
import { authApi } from '../features/auth/api/authApi'
import { PATHS } from '../app/router/paths'
import chickenMascotImg from '../assets/chicken-mascot.png'
import { toast } from '../components/feedback/Toast'

interface AccountLayoutProps {
  children: React.ReactNode
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { isAccountOpen, openAccountMenu, closeAccountMenu, toggleAccountMenu } = useAccountNav()
  const [searchQuery, setSearchQuery] = React.useState('')

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate(PATHS.HOME, { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleLogout = async () => {
    closeAccountMenu()
    try { await authApi.logout() } catch { /* ignore */ }
    cartStore.resetCart()
    logout()
    navigate(PATHS.HOME, { replace: true })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/search')
    }
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? user?.phone?.[0] ?? 'U'

  const displayName = user?.fullName || user?.username || user?.email?.split('@')[0] || user?.phone || 'User'

  // Check active routes
  const isProfileActive = location.pathname === PATHS.ACCOUNT.PROFILE
  const isCardsActive = location.pathname === PATHS.ACCOUNT.CARDS
  const isAddressesActive = location.pathname === PATHS.ACCOUNT.ADDRESSES
  const isPasswordActive = location.pathname === PATHS.ACCOUNT.PASSWORD
  const isAccountGroupActive = isProfileActive || isCardsActive || isAddressesActive || isPasswordActive

  const isNotificationsActive = location.pathname === PATHS.ACCOUNT.NOTIFICATIONS
  const isOrdersActive = location.pathname === PATHS.ACCOUNT.ORDERS
  const isVouchersActive = location.pathname === PATHS.ACCOUNT.VOUCHERS

  const handleAccountHeaderClick = () => {
    if (!isAccountOpen) {
      openAccountMenu()
      if (!isAccountGroupActive) {
        navigate(PATHS.ACCOUNT.PROFILE)
      }
    } else {
      toggleAccountMenu()
    }
  }

  return (
    <div className="shopee-page">
      {/* Topbar ChickyMart Yellow Style */}
      <nav className="account-topbar">
        <div className="account-topbar-inner">
          {/* Brand with Chicken Mascot */}
          <Link to={PATHS.HOME} className="account-topbar-brand">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                backgroundColor: '#fef08a',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={chickenMascotImg}
                alt="ChickyMart Mascot"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15) translateY(2px)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="account-topbar-title">ChickyMart</span>
              <span className="account-topbar-subtitle">Account Center</span>
            </div>
          </Link>

          {/* Functional Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: 1,
              maxWidth: 500,
              margin: '0 28px',
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 8,
              padding: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1.5px solid #fde68a',
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, orders and vouchers..."
              style={{
                flex: 1,
                height: 34,
                border: 'none',
                outline: 'none',
                padding: '0 12px',
                fontSize: 13,
                color: '#1e293b',
                background: 'transparent',
              }}
            />
            <button
              type="submit"
              style={{
                height: 34,
                padding: '0 18px',
                background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                color: '#0f172a',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              Search
            </button>
          </form>

          {/* Right Header items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              to={PATHS.ACCOUNT.PROFILE}
              onClick={openAccountMenu}
              className="account-topbar-user"
              style={{ textDecoration: 'none', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <div className="account-topbar-avatar">
                {initials}
              </div>
              <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700 }}>
                {displayName}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              style={{ background: 'rgba(15, 23, 42, 0.08)', border: 'none', color: '#0f172a', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', borderRadius: 6 }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout: 4 Sections Sidebar + Content */}
      <div className="shopee-layout">
        {/* Left Sidebar */}
        <aside className="shopee-sidebar">
          {/* User profile header */}
          <div className="shopee-sidebar-user">
            <div className="shopee-sidebar-avatar">
              {initials}
            </div>
            <div className="shopee-sidebar-info">
              <span className="shopee-sidebar-username">{displayName}</span>
              <Link to={PATHS.ACCOUNT.PROFILE} onClick={openAccountMenu} className="shopee-sidebar-edit-link">
                Edit Profile
              </Link>
            </div>
          </div>

          {/* 4 Sections Navigation */}
          <nav className="shopee-sidebar-nav">
            {/* 1. Notifications */}
            <Link
              to={PATHS.ACCOUNT.NOTIFICATIONS}
              onClick={closeAccountMenu}
              className={`shopee-nav-header ${isNotificationsActive ? 'active' : ''}`}
            >
              Notifications
            </Link>

            {/* 2. My Account (Expandable / Accordion group with sub-items) */}
            <div>
              <button
                type="button"
                onClick={handleAccountHeaderClick}
                className={`shopee-nav-header ${isAccountGroupActive ? 'active' : ''}`}
              >
                <span>My Account</span>
              </button>
              <div className={`shopee-nav-sublist ${isAccountOpen ? 'open' : ''}`}>
                <Link
                  to={PATHS.ACCOUNT.PROFILE}
                  className={`shopee-nav-subitem ${isProfileActive ? 'active' : ''}`}
                >
                  Profile
                </Link>
                <Link
                  to={PATHS.ACCOUNT.CARDS}
                  className={`shopee-nav-subitem ${isCardsActive ? 'active' : ''}`}
                >
                  Banks & Cards
                </Link>
                <Link
                  to={PATHS.ACCOUNT.ADDRESSES}
                  className={`shopee-nav-subitem ${isAddressesActive ? 'active' : ''}`}
                >
                  Addresses
                </Link>
                <Link
                  to={PATHS.ACCOUNT.PASSWORD}
                  className={`shopee-nav-subitem ${isPasswordActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    toast.info('Chức năng Đổi mật khẩu đang được bảo trì nâng cấp.')
                  }}
                >
                  Change Password
                </Link>
              </div>
            </div>

            {/* 3. My Purchase */}
            <Link
              to={PATHS.ACCOUNT.ORDERS}
              onClick={closeAccountMenu}
              className={`shopee-nav-header ${isOrdersActive ? 'active' : ''}`}
            >
              My Purchase
            </Link>

            {/* 4. My Vouchers */}
            <Link
              to={PATHS.ACCOUNT.VOUCHERS}
              onClick={closeAccountMenu}
              className={`shopee-nav-header ${isVouchersActive ? 'active' : ''}`}
            >
              My Vouchers
            </Link>

            {/* Sign Out */}
            <button className="shopee-sidebar-signout" onClick={handleLogout}>
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Right Content */}
        <main style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
