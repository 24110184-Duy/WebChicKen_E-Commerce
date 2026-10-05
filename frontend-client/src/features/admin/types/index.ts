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
