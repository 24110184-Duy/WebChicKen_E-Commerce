import { Routes, Route, Navigate } from 'react-router-dom'
import { PATHS } from './paths'
import { LoginPage } from '../../pages/public/auth/LoginPage'
import { RegisterPage } from '../../pages/public/auth/RegisterPage'
import { HomePage } from '../../pages/public/HomePage'

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={PATHS.HOME} element={<HomePage />} />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.REGISTER} element={<RegisterPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  )
}
