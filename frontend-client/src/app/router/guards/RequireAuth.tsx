import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PATHS } from '../paths'

export interface RequireAuthProps {
  children?: React.ReactNode
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="cart-spinner" style={{ width: 36, height: 36 }} />
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Đang xác thực bảo mật...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location.pathname }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
