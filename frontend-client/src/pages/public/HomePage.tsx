import React from 'react'
import { Link } from 'react-router-dom'
import { LogIn, UserPlus, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { authApi } from '../../features/auth/api/authApi'
import { PATHS } from '../../app/router/paths'

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.warn('Logout error', err)
    } finally {
      logout()
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: '#ffffff',
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 900 }}>
              Web<span style={{ color: '#ee4d2d' }}>ChicKen</span>
            </span>
          </Link>
          <span style={{ fontSize: '11px', backgroundColor: '#fff5f1', padding: '3px 8px', borderRadius: '4px', color: '#ee4d2d', fontWeight: 600 }}>
            E-Commerce Marketplace
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Welcome,</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  {user.fullName || user.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to={PATHS.LOGIN}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ee4d2d',
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(238, 77, 45, 0.3)',
                }}
              >
                <LogIn size={15} />
                Sign In
              </Link>
              <Link
                to={PATHS.REGISTER}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <UserPlus size={15} />
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Showcase */}
      <main style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '40px auto', padding: '0 20px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '36px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ShieldCheck size={30} color="#16a34a" />
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              WebChicKen Identity & Authentication System
            </h1>
          </div>

          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
            Built using modern e-commerce marketplace standards with split hero layout, instant validation,
            seamless <code>authStore</code> state management, and direct integration with Java Servlet 6.0 backend.
          </p>

          {/* Current Auth Status */}
          <div
            style={{
              backgroundColor: isAuthenticated ? '#f0fdf4' : '#fff7ed',
              border: `1px solid ${isAuthenticated ? '#bbf7d0' : '#ffedd5'}`,
              borderRadius: '12px',
              padding: '18px 22px',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px', color: isAuthenticated ? '#15803d' : '#c2410c', marginBottom: '6px' }}>
              Current Authentication State: {isAuthenticated ? '✓ SIGNED IN' : 'GUEST (NOT SIGNED IN)'}
            </div>
            {isAuthenticated && user ? (
              <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
                <div>• User ID: <code>{user.id}</code></div>
                <div>• Email: <strong>{user.email}</strong></div>
                <div>• Full Name: {user.fullName || '(Not provided)'}</div>
                <div>• Roles: {user.roles.join(', ')}</div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#9a3412' }}>
                Click <strong>Sign In</strong> or <strong>Sign Up</strong> above to test the authentication experience.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to={PATHS.LOGIN}
              style={{
                backgroundColor: '#ee4d2d',
                color: '#ffffff',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(238, 77, 45, 0.35)',
              }}
            >
              Open Sign In Page
            </Link>

            <Link
              to={PATHS.REGISTER}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#1e293b',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Open Sign Up Page
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '12px' }}>
        WebChicKen Marketplace &copy; 2026 — Headless Monorepo Architecture
      </footer>
    </div>
  )
}
export default HomePage
