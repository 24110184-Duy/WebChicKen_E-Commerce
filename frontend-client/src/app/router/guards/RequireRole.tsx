import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PATHS } from '../paths'

export interface RequireRoleProps {
  allowedRoles: string[]
  fallbackPath?: string
  children?: React.ReactNode
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  fallbackPath = PATHS.FORBIDDEN,
  children,
}) => {
  const { user, isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="cart-spinner" style={{ width: 36, height: 36 }} />
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location.pathname }} replace />
  }

  const userRoles = user?.roles || []
  const hasRequiredRole = allowedRoles.some((role) => {
    if (role === 'ADMIN') {
      return userRoles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(r))
    }
    if (role === 'SELLER') {
      const isLocalRegistered = user?.id ? localStorage.getItem(`seller_registered_${user.id}`) === 'true' : false
      return userRoles.includes('SELLER') || isLocalRegistered
    }
    return userRoles.includes(role)
  })

  if (!hasRequiredRole) {
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
