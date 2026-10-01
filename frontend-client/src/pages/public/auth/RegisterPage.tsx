import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { RegisterForm } from '../../../features/auth/components/RegisterForm'
import { useAuthStore } from '../../../app/store/authStore'
import { PATHS } from '../../../app/router/paths'

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(PATHS.HOME, { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
export default RegisterPage
