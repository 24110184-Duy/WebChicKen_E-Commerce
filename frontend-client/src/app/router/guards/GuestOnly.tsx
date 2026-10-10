import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PATHS } from '../paths'

export interface GuestOnlyProps {
  children?: React.ReactNode
}

export const GuestOnly: React.FC<GuestOnlyProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) {
    return null
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from || PATHS.HOME
    return <Navigate to={from} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
