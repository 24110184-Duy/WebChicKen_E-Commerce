export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SellerApplication {
  id: string
  userId: string
  shopName: string
  documentUrl?: string
  status: ApplicationStatus
  rejectionReason?: string
  adminResponseId?: string
  submittedAt: string
  reviewedAt?: string
  // Extended fields for rich compliance verification
  ownerName?: string
  phone?: string
  email?: string
  farmLocation?: string
  farmType?: string
  taxCode?: string
  certificateType?: string
  certificateNumber?: string
  certificateExpiry?: string
  dailyCapacity?: string
}

export interface ReviewApplicationRequest {
  status: 'APPROVED' | 'REJECTED' | 'APPROVE' | 'REJECT'
  rejectionReason?: string
}

export type ApplicationFilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

// ==========================================
// Product Moderation Types (TASK-65)
// ==========================================
export type AdminProductStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
export type ProductModerationFilterTab = 'ALL' | 'PENDING_APPROVAL' | 'ACTIVE' | 'BOT_APPROVED' | 'ADMIN_APPROVED' | 'INACTIVE'

export interface AdminProductVariant {
  id: string
  attribute: string
  basePriceMinor: number
  stockQuantity: number
}

export interface AdminProductItem {
  id: string
  storeId: string
  storeName?: string
  categoryId: string
  categoryName?: string
  name: string
  description?: string
  status: AdminProductStatus
  rejectionReason?: string
  moderatedBy?: string
  moderationNote?: string
  thumbnailUrl?: string
  imageUrls?: string[]
  minPriceMinor: number
  maxPriceMinor: number
  totalStock: number
  variants?: AdminProductVariant[]
  createdAt: string
  updatedAt?: string
  // Thẩm định chất lượng / kiểm dịch
  origin?: string
  farmingStandard?: string
  veterinaryInspectionCode?: string
}

export interface ReviewProductRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL'
  rejectionReason?: string
  moderationNote?: string
}

// ==========================================
// User Moderation & Account Ban Types (TASK-66)
// ==========================================
export type AdminUserStatus = 'ACTIVE' | 'LOCKED' | 'BANNED'
export type AdminUserRole = 'CUSTOMER' | 'SELLER' | 'SUPER_ADMIN' | 'MODERATOR'
export type AdminUserFilterTab = 'ALL' | 'ACTIVE' | 'BANNED' | 'LOCKED'
export type AdminUserRoleFilter = 'ALL' | 'CUSTOMER' | 'SELLER' | 'ADMIN'

export interface AccountBanInfo {
  banId: string
  userId: string
  description: string
  bannedAt: string
  bannedUntil?: string | null
  bannedBy?: string | null
  unbannedAt?: string | null
  isActive: boolean
}

export interface AdminUserItem {
  userId: string
  email: string
  fullName: string
  phone?: string
  logoUrl?: string
  status: AdminUserStatus
  roles: string[]
  tier?: string
  loyaltyPoint?: number
  storeId?: string
  storeName?: string
  createdAt: string
  updatedAt?: string
  activeBan?: AccountBanInfo | null
}

export interface BanUserRequest {
  reason: string
  durationDays?: number | null
  bannedUntil?: string | null
}

export interface UnbanUserRequest {
  reason?: string
}

export interface AdminUserPageResponse {
  items: AdminUserItem[]
  total: number
  page: number
  size: number
  totalPages: number
}

export interface AdminUserStatsResponse {
  totalUsers: number
  buyers: number
  sellers: number
  bannedUsers: number
  lockedUsers: number
  activeUsers: number
}

// ==========================================
// Admin Audit Logging Types (TASK-67)
// ==========================================
export type AuditLogActionFilter = 'ALL' | 'BAN_USER' | 'UNBAN_USER' | 'APPROVE_PRODUCT' | 'REJECT_PRODUCT' | 'APPROVE_SELLER' | 'REJECT_SELLER'
export type AuditLogTargetFilter = 'ALL' | 'USER' | 'PRODUCT' | 'SELLER_APPLICATION' | 'ORDER'

export interface AuditLogItem {
  id: string
  adminId: string
  adminEmail?: string | null
  adminName?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  detail?: string | null
  ipAddress?: string | null
  createdAt: string
}

export interface AuditLogPageResponse {
  items: AuditLogItem[]
  total: number
  page: number
  size: number
  totalPages: number
}

export interface ActionBadgeConfig {
  label: string
  bg: string
  color: string
  border: string
}

export function getAuditActionBadge(action: string): ActionBadgeConfig {
  switch (action) {
    case 'BAN_USER':
      return { label: 'Khóa tài khoản', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
    case 'UNBAN_USER':
      return { label: 'Mở khóa tài khoản', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
    case 'APPROVE_PRODUCT':
      return { label: 'Duyệt sản phẩm', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
    case 'REJECT_PRODUCT':
      return { label: 'Từ chối sản phẩm', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }
    case 'APPROVE_SELLER':
      return { label: 'Duyệt người bán', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' }
    case 'REJECT_SELLER':
      return { label: 'Từ chối người bán', bg: '#fff7ed', color: '#9a3412', border: '#ffedd5' }
    default:
      return { label: action, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' }
  }
}

