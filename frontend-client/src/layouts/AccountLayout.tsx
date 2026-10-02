import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, MapPin, ShoppingBag, Ticket, Star, LogOut } from 'lucide-react'
import { useAuthStore } from '../app/store/authStore'
import { authApi } from '../features/auth/api/authApi'
import { PATHS } from '../app/router/paths'

interface AccountLayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  {
    section: 'My Account',
    items: [
      { label: 'My Profile', icon: User, path: PATHS.ACCOUNT.PROFILE },
      { label: 'Address Book', icon: MapPin, path: PATHS.ACCOUNT.ADDRESSES },
    ],
  },
  {
    section: 'Shopping',
    items: [
      { label: 'My Orders', icon: ShoppingBag, path: PATHS.ACCOUNT.ORDERS },
      { label: 'My Vouchers', icon: Ticket, path: PATHS.ACCOUNT.VOUCHERS },
      { label: 'My Reviews', icon: Star, path: PATHS.ACCOUNT.REVIEWS },
    ],
  },
]

export const AccountLayout: React.FC<AccountLayoutProps> = ({ children }) => {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="account-page">
      {/* Topbar */}
      <nav className="account-topbar">
        <div className="account-topbar-inner">
          <Link to={PATHS.HOME} className="account-topbar-brand">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="account-topbar-title">ChickyMart</span>
              <span className="account-topbar-subtitle">My Account</span>
            </div>
          </Link>
          <div className="account-topbar-user">
            <div className="account-topbar-avatar">{initials}</div>
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName || user?.email}
            </span>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="account-layout">
        {/* Sidebar */}
        <aside className="account-sidebar">
          <div className="account-sidebar-user">
            <div className="account-sidebar-avatar">{initials}</div>
            <div>
              <div className="account-sidebar-name">{user?.fullName || user?.email}</div>
              <div className="account-sidebar-edit">
                <Link to={PATHS.ACCOUNT.PROFILE} style={{ color: '#b45309', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          <nav className="account-sidebar-nav">
            {NAV_ITEMS.map((group) => (
              <div key={group.section}>
                <div className="account-sidebar-section">{group.section}</div>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`account-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={15} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}

            <div className="account-sidebar-section">Other</div>
            <button className="account-nav-item" onClick={handleLogout}>
              <LogOut size={15} />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="account-content">
          {children}
        </main>
      </div>
    </div>
  )
}
