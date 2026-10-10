import { Routes, Route, Navigate } from 'react-router-dom'
import { PATHS } from './paths'
import { RequireAuth } from './guards/RequireAuth'
import { RequireRole } from './guards/RequireRole'
import { GuestOnly } from './guards/GuestOnly'
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
import { SellerProductListPage } from '../../pages/seller/SellerProductListPage'
import { SellerOrdersPage } from '../../pages/seller/SellerOrdersPage'
import { SellerDashboardPage } from '../../pages/seller/SellerDashboardPage'
import { SellerFeedbackPage } from '../../pages/seller/SellerFeedbackPage'
import { SellerRegisterPage } from '../../pages/seller/SellerRegisterPage'
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage'
import { SellersPage } from '../../pages/admin/Sellers'
import { AdminProductsPage } from '../../pages/admin/Products'
import { AdminUsersPage } from '../../pages/admin/Users'
import { AdminAuditLogsPage } from '../../pages/admin/AuditLogsPage'
import { AdminFeedbacksPage } from '../../pages/admin/AdminFeedbacksPage'
import { AdminVouchersPage } from '../../pages/admin/AdminVouchersPage'
import { ForbiddenPage } from '../../pages/errors/ForbiddenPage'

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public & Shopping Routes */}
      <Route path={PATHS.HOME} element={<HomePage />} />
      <Route
        path={PATHS.LOGIN}
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path={PATHS.REGISTER}
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route path={PATHS.SEARCH} element={<ProductListingPage />} />
      <Route path="/products" element={<ProductListingPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/p/:slug" element={<ProductDetailPage />} />

      {/* Cart & Checkout Routes */}
      <Route
        path={PATHS.CART}
        element={
          <RequireAuth>
            <CartPage />
          </RequireAuth>
        }
      />
      <Route
        path={PATHS.CHECKOUT}
        element={
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        }
      />
      <Route path={PATHS.PAYMENT_RESULT} element={<PaymentResultPage />} />

      {/* Buyer Account Routes (Must Be Authenticated) */}
      <Route element={<RequireAuth />}>
        <Route path={PATHS.ACCOUNT.PROFILE} element={<ProfilePage />} />
        <Route path={PATHS.ACCOUNT.ADDRESSES} element={<AddressesPage />} />
        <Route path={PATHS.ACCOUNT.CARDS} element={<BanksCardsPage />} />
        <Route path={PATHS.ACCOUNT.VOUCHERS} element={<VouchersPage />} />
        <Route path={PATHS.ACCOUNT.ORDERS} element={<OrdersPage />} />
        <Route path="/buyer/orders" element={<OrdersPage />} />
        <Route path={PATHS.ACCOUNT.NOTIFICATIONS} element={<NotificationsPage />} />
      </Route>

      {/* Seller Onboarding / Registration (Must Be Authenticated) */}
      <Route
        path={PATHS.SELLER.REGISTER}
        element={
          <RequireAuth>
            <SellerRegisterPage />
          </RequireAuth>
        }
      />
      <Route
        path="/seller/register"
        element={
          <RequireAuth>
            <SellerRegisterPage />
          </RequireAuth>
        }
      />

      {/* Protected Seller Center Routes (Must Have 'SELLER' Role) */}
      <Route element={<RequireRole allowedRoles={['SELLER']} fallbackPath={PATHS.SELLER.REGISTER} />}>
        <Route path={PATHS.SELLER.DASHBOARD} element={<SellerDashboardPage />} />
        <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
        <Route path={PATHS.SELLER.PRODUCTS} element={<SellerProductListPage />} />
        <Route path="/seller/products/new" element={<SellerProductListPage />} />
        <Route path={PATHS.SELLER.ORDERS} element={<SellerOrdersPage />} />
        <Route path="/seller/orders/:id" element={<SellerOrdersPage />} />
        <Route path={PATHS.SELLER.FEEDBACK} element={<SellerFeedbackPage />} />
        <Route path="/seller/feedback" element={<SellerFeedbackPage />} />
      </Route>

      {/* Protected Backoffice Admin Routes (Must Have ADMIN / SUPER_ADMIN / MODERATOR Role) */}
      <Route element={<RequireRole allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MODERATOR']} fallbackPath={PATHS.FORBIDDEN} />}>
        <Route path={PATHS.ADMIN.DASHBOARD} element={<AdminDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path={PATHS.ADMIN.SHOPS} element={<SellersPage />} />
        <Route path="/admin/sellers" element={<SellersPage />} />
        <Route path={PATHS.ADMIN.PRODUCTS} element={<AdminProductsPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path={PATHS.ADMIN.USERS} element={<AdminUsersPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path={PATHS.ADMIN.AUDIT_LOGS} element={<AdminAuditLogsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path={PATHS.ADMIN.FEEDBACKS} element={<AdminFeedbacksPage />} />
        <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
        <Route path={PATHS.ADMIN.VOUCHERS} element={<AdminVouchersPage />} />
        <Route path="/admin/vouchers" element={<AdminVouchersPage />} />
      </Route>

      {/* Error & Access Control Pages */}
      <Route path={PATHS.FORBIDDEN} element={<ForbiddenPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  )
}
