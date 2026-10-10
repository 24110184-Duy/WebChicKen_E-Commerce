/**
 * WebChicKen Route Paths Constants — Tập trung toàn bộ đường dẫn ứng dụng
 * Quy ước: ARCHITECTURE.md 4.3, 4.4, 5.3
 */
export const PATHS = {
  // Public & Shopping
  HOME: '/',
  SEARCH: '/search',
  CATEGORY: (slug: string) => `/c/${slug}`,
  PRODUCT_DETAIL: (slug: string, id: string) => `/p/${slug}-i.${id}`,
  SHOP_DETAIL: (shopId: string) => `/shops/${shopId}`,
  VOUCHERS: '/vouchers',
  FLASH_SALES: '/flash-sales',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: (token = ':token') => `/reset-password/${token}`,
  VERIFY_EMAIL: (token = ':token') => `/verify-email/${token}`,

  // Buyer
  CART: '/cart',
  CHECKOUT: '/checkout',
  PAYMENT_RESULT: '/checkout/result',
  ACCOUNT: {
    PROFILE: '/account/profile',
    ADDRESSES: '/account/addresses',
    CARDS: '/account/cards',
    ORDERS: '/account/orders',
    ORDER_DETAIL: (orderId: string) => `/account/orders/${orderId}`,
    VOUCHERS: '/account/vouchers',
    NOTIFICATIONS: '/account/notifications',
    PASSWORD: '/account/password',
    REVIEWS: '/account/reviews',
  },

  // Seller Center
  SELLER: {
    REGISTER: '/seller/register',
    DASHBOARD: '/seller',
    SHIPMENT: '/seller/shipment',
    PRODUCTS: '/seller/products',
    PRODUCT_NEW: '/seller/products/new',
    PRODUCT_EDIT: (id: string) => `/seller/products/${id}/edit`,
    INVENTORY: '/seller/inventory',
    ORDERS: '/seller/orders',
    ORDER_DETAIL: (id: string) => `/seller/orders/${id}`,
    PROMOTIONS: '/seller/promotions',
    REVIEWS: '/seller/reviews',
    REPORTS: '/seller/reports',
    SETTINGS: '/seller/settings',
    FEEDBACK: '/seller/feedback',
  },

  // Admin Portal
  ADMIN: {
    DASHBOARD: '/admin',
    SHOPS: '/admin/shops',
    USERS: '/admin/users',
    CATEGORIES: '/admin/categories',
    BRANDS: '/admin/brands',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    REVIEWS: '/admin/reviews',
    CAMPAIGNS: '/admin/campaigns',
    VOUCHERS: '/admin/vouchers',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    AUDIT_LOGS: '/admin/audit-logs',
    FEEDBACKS: '/admin/feedbacks',
  },

  // Errors
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
  NOT_FOUND: '/404',
} as const
