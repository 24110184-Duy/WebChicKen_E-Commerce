import React from 'react'
import { Link } from 'react-router-dom'
import { LogIn, UserPlus, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { authApi } from '../../features/auth/api/authApi'
import { WebChicKenLogo } from '../../features/auth/components/WebChicKenLogo'
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafaf9' }}>
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: '#ffffff',
          color: '#1c1917',
          borderBottom: '1px solid #e7e5e4',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <WebChicKenLogo size="md" />
          <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '4px', color: '#b45309', fontWeight: 700 }}>
            E-Commerce Marketplace
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#78716c' }}>Welcome,</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917' }}>
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
                  backgroundColor: '#facc15',
                  color: '#0f172a',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(234, 179, 8, 0.35)',
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
                  color: '#1c1917',
                  border: '1.5px solid #d6d3d1',
                  padding: '7px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
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
            borderRadius: '18px',
            border: '1px solid #e7e5e4',
            padding: '36px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ShieldCheck size={32} color="#16a34a" />
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              ChickyMart Identity & Authentication
            </h1>
          </div>

          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
            Featuring our bright sunny yellow theme, cute chicken mascot, split-hero marketplace layout,
            and robust Java Servlet 6.0 token rotation backend.
          </p>

          {/* Current Auth Status */}
          <div
            style={{
              backgroundColor: isAuthenticated ? '#f0fdf4' : '#fefce8',
              border: `1px solid ${isAuthenticated ? '#bbf7d0' : '#fef08a'}`,
              borderRadius: '12px',
              padding: '18px 22px',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px', color: isAuthenticated ? '#15803d' : '#854d0e', marginBottom: '6px' }}>
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
              <div style={{ fontSize: '13px', color: '#a16207' }}>
                Click <strong>Sign In</strong> or <strong>Sign Up</strong> above to test the authentication experience.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to={PATHS.LOGIN}
              style={{
                backgroundColor: '#facc15',
                color: '#0f172a',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(234, 179, 8, 0.4)',
              }}
            >
              Open Sign In Page
            </Link>

            <Link
              to={PATHS.REGISTER}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #d6d3d1',
                color: '#1c1917',
                padding: '10px 24px',
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
      <footer style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '12px' }}>
        ChickyMart Marketplace &copy; 2026 — Headless Monorepo Architecture
      </footer>
    </div>
  )
}
export default HomePage
