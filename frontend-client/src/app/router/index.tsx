import { Routes, Route, Navigate } from 'react-router-dom'
import { PATHS } from './paths'
import { LoginPage } from '../../pages/public/auth/LoginPage'
import { RegisterPage } from '../../pages/public/auth/RegisterPage'
import { HomePage } from '../../pages/public/HomePage'
import { ProfilePage } from '../../pages/buyer/account/ProfilePage'
import { AddressesPage } from '../../pages/buyer/account/AddressesPage'

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={PATHS.HOME} element={<HomePage />} />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.REGISTER} element={<RegisterPage />} />

      {/* Buyer Account Routes */}
      <Route path={PATHS.ACCOUNT.PROFILE} element={<ProfilePage />} />
      <Route path={PATHS.ACCOUNT.ADDRESSES} element={<AddressesPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  )
}
