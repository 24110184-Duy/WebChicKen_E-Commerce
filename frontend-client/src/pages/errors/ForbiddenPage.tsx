import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, Store, LogIn, Home } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { PATHS } from '../../app/router/paths'

export const ForbiddenPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogoutAndSwitch = () => {
    logout()
    navigate(PATHS.LOGIN, { state: { from: window.location.pathname } })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 580,
          width: '100%',
          backgroundColor: '#1e293b',
          borderRadius: 24,
          padding: '48px 36px',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.1)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Glow badge */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: 24,
          }}
        >
          <ShieldAlert style={{ width: 44, height: 44 }} />
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 20,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          403 • ACCESS RESTRICTED
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 12px',
            lineHeight: 1.3,
          }}
        >
          Truy Cập Bị Từ Chối
        </h1>

        <p
          style={{
            fontSize: 15,
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: '0 0 28px',
          }}
        >
          Tài khoản hiện tại của bạn không có thẩm quyền truy cập vào phân hệ này (yêu cầu quyền Quản Trị Viên hoặc Người Bán hàng hợp lệ).
        </p>

        {isAuthenticated && user && (
          <div
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 12,
              padding: '14px 18px',
              border: '1px solid #334155',
              marginBottom: 32,
              textAlign: 'left',
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#64748b' }}>Đang đăng nhập bằng:</span>
              <strong style={{ color: '#e2e8f0' }}>{user.email || user.username || user.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Vai trò hiện có:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'CUSTOMER'}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            to={PATHS.HOME}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <Home style={{ width: 16, height: 16 }} />
            <span>Quay về Trang Chủ ChickyMart</span>
          </Link>

          {(!user?.roles || !user.roles.includes('SELLER')) && (
            <Link
              to={PATHS.SELLER.REGISTER}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: 'rgba(234, 179, 8, 0.12)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Store style={{ width: 16, height: 16 }} />
              <span>Đăng ký Mở Gian Hàng Người Bán</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogoutAndSwitch}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid #334155',
              padding: '12px 20px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogIn style={{ width: 16, height: 16 }} />
            <span>Đổi Tài Khoản Khác (Admin / Seller)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
