import { Routes, Route, Navigate } from 'react-router-dom'
import { PATHS } from './paths'
import { LoginPage } from '../../pages/public/auth/LoginPage'
import { RegisterPage } from '../../pages/public/auth/RegisterPage'
import { HomePage } from '../../pages/public/HomePage'
import { ProductListingPage } from '../../pages/public/ProductListingPage'
import { ProductDetailPage } from '../../pages/public/ProductDetailPage'
import { CartPage } from '../../pages/buyer/CartPage'
import { CheckoutPage } from '../../pages/buyer/CheckoutPage'
import { PaymentResultPage } from '../../pages/buyer/PaymentResultPage'
import { ProfilePage } from '../../pages/buyer/account/ProfilePage'
import { AddressesPage } from '../../pages/buyer/account/AddressesPage'
import { BanksCardsPage } from '../../pages/buyer/account/BanksCardsPage'
import { VouchersPage } from '../../pages/buyer/account/VouchersPage'
import { OrdersPage } from '../../pages/buyer/account/OrdersPage'
import { NotificationsPage } from '../../pages/buyer/account/NotificationsPage'

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public & Shopping Routes */}
      <Route path={PATHS.HOME} element={<HomePage />} />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      <Route path={PATHS.SEARCH} element={<ProductListingPage />} />
      <Route path="/products" element={<ProductListingPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/p/:slug" element={<ProductDetailPage />} />

      {/* Cart & Checkout Routes */}
      <Route path={PATHS.CART} element={<CartPage />} />
      <Route path={PATHS.CHECKOUT} element={<CheckoutPage />} />
      <Route path={PATHS.PAYMENT_RESULT} element={<PaymentResultPage />} />

      {/* Buyer Account Routes */}
      <Route path={PATHS.ACCOUNT.PROFILE} element={<ProfilePage />} />
      <Route path={PATHS.ACCOUNT.ADDRESSES} element={<AddressesPage />} />
      <Route path={PATHS.ACCOUNT.CARDS} element={<BanksCardsPage />} />
      <Route path={PATHS.ACCOUNT.VOUCHERS} element={<VouchersPage />} />
      <Route path={PATHS.ACCOUNT.ORDERS} element={<OrdersPage />} />
      <Route path={PATHS.ACCOUNT.NOTIFICATIONS} element={<NotificationsPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  )
}
