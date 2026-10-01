import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { LoginForm } from '../../../features/auth/components/LoginForm'
import { useAuthStore } from '../../../app/store/authStore'
import { PATHS } from '../../../app/router/paths'

export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(PATHS.HOME, { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
export default LoginPage
