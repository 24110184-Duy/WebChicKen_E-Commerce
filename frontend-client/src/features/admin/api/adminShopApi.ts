import { httpClient } from '../../../shared/api/httpClient'
import type { SellerApplication, ReviewApplicationRequest } from '../types'
import { recordAuditLogMock } from './adminAuditApi'

// Realistic fallback demo data for poultry marketplace backoffice
const INITIAL_DEMO_APPLICATIONS: SellerApplication[] = [
  {
    id: 'APP-2026-001',
    userId: 'usr-farm-01',
    shopName: 'Trang Trại Gà Đồi Yên Thế - Bắc Giang',
    documentUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    status: 'PENDING',
    submittedAt: '2026-10-04T14:30:00Z',
    ownerName: 'Nguyễn Văn Hùng',
    phone: '0982 123 456',
    email: 'hung.yenthefarm@gmail.com',
    farmLocation: 'Huyện Yên Thế, Tỉnh Bắc Giang',
    farmType: 'Gà Đồi Chăn Thả Tự Nhiên',
    taxCode: '2400891234',
    certificateType: 'Chứng Nhận VietGAP Chăn Nuôi An Toàn',
    certificateNumber: 'VG-CN-2024-BG-089',
    certificateExpiry: '2027-12-31',
    dailyCapacity: '500 - 800 con/ngày',
  },
  {
    id: 'APP-2026-002',
    userId: 'usr-farm-02',
    shopName: 'Nông Trại Vịt Cỏ Vân Đình - Hà Tây',
    documentUrl: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?auto=format&fit=crop&w=800&q=80',
    status: 'PENDING',
    submittedAt: '2026-10-05T08:15:00Z',
    ownerName: 'Trần Thị Thu Hà',
    phone: '0912 888 999',
    email: 'contact@vandinhduck.vn',
    farmLocation: 'Huyện Ứng Hòa, Hà Nội',
    farmType: 'Vịt Cỏ & Vịt Bầu Thả Đồng',
    taxCode: '0109923481',
    certificateType: 'Chứng Nhận Vệ Sinh Thú Y & Kiểm Dịch Vùng',
    certificateNumber: 'KD-HN-TY-2025-412',
    certificateExpiry: '2026-11-20',
    dailyCapacity: '300 - 450 con/ngày',
  },
  {
    id: 'APP-2026-003',
    userId: 'usr-farm-03',
    shopName: 'Hợp Tác Xã Gia Cầm Hữu Cơ Ba Vì',
    documentUrl: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=800&q=80',
    status: 'PENDING',
    submittedAt: '2026-10-05T09:00:00Z',
    ownerName: 'Phạm Đức Long',
    phone: '0973 456 789',
    email: 'long.baviorganic@coop.vn',
    farmLocation: 'Xã Ba Trại, Huyện Ba Vì, Hà Nội',
    farmType: 'Gà Mía & Trứng Gà Thảo Dược Hữu Cơ',
    taxCode: '0108765432',
    certificateType: 'HACCP & Organic Poultry Standard',
    certificateNumber: 'HACCP-POULTRY-VN-0091',
    certificateExpiry: '2028-05-15',
    dailyCapacity: '1,000 quả trứng & 200 con gà/ngày',
  },
  {
    id: 'APP-2026-004',
    userId: 'usr-farm-04',
    shopName: 'Trang Trại Gà Ri Tiến Vua Hưng Yên',
    documentUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    status: 'APPROVED',
    submittedAt: '2026-09-28T10:00:00Z',
    reviewedAt: '2026-09-29T08:30:00Z',
    adminResponseId: 'adm-super-01',
    ownerName: 'Vũ Quốc Toàn',
    phone: '0903 234 567',
    email: 'toan.phohien@gariviet.vn',
    farmLocation: 'TP. Hưng Yên, Tỉnh Hưng Yên',
    farmType: 'Gà Ri Thuần Chủng & Gà Đông Tảo Lai',
    taxCode: '0900123890',
    certificateType: 'VietGAP & ISO 22000:2018',
    certificateNumber: 'VG-HY-2024-118',
    certificateExpiry: '2027-08-30',
    dailyCapacity: '400 con/ngày',
  },
  {
    id: 'APP-2026-005',
    userId: 'usr-farm-05',
    shopName: 'Gia Cầm Thất Khê Lạng Sơn - Vịt Quay Chuẩn Vị',
    documentUrl: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?auto=format&fit=crop&w=800&q=80',
    status: 'APPROVED',
    submittedAt: '2026-09-25T11:20:00Z',
    reviewedAt: '2026-09-26T14:10:00Z',
    adminResponseId: 'adm-super-01',
    ownerName: 'Hoàng Văn Lập',
    phone: '0945 678 910',
    email: 'thatkhe.farm@gmail.com',
    farmLocation: 'Huyện Tràng Định, Tỉnh Lạng Sơn',
    farmType: 'Vịt Bầu Thất Khê & Ngỗng Cỏ Xứ Lạng',
    taxCode: '2001198273',
    certificateType: 'Chứng Nhận Cơ Sở Đủ Điều Kiện An Toàn Thực Phẩm',
    certificateNumber: 'ATTP-LS-2024-55',
    certificateExpiry: '2027-03-10',
    dailyCapacity: '600 con/ngày',
  },
  {
    id: 'APP-2026-006',
    userId: 'usr-farm-06',
    shopName: 'Hộ Chăn Nuôi Gà Đông Tảo Mini',
    documentUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    status: 'REJECTED',
    rejectionReason: 'Thiếu giấy chứng nhận kiểm dịch thú y vùng nuôi và địa chỉ cơ sở sản xuất không xác minh được trên hệ thống bản đồ vệ sinh.',
    submittedAt: '2026-09-20T16:00:00Z',
    reviewedAt: '2026-09-21T09:45:00Z',
    adminResponseId: 'adm-super-01',
    ownerName: 'Đặng Minh Đức',
    phone: '0936 999 111',
    email: 'duc.dongtaomini@gmail.com',
    farmLocation: 'Khoái Châu, Hưng Yên',
    farmType: 'Gà Đông Tảo Kiểng',
    taxCode: 'Chưa cung cấp',
    certificateType: 'Chưa có giấy chứng nhận hợp lệ',
    dailyCapacity: '50 con/ngày',
  },
]

// In-memory / sessionStorage store for instant interactive dev preview
const STORAGE_KEY = 'webchicken_admin_seller_apps'

function getStoredApplications(): SellerApplication[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as SellerApplication[]
    }
  } catch {
    // ignore
  }
  return [...INITIAL_DEMO_APPLICATIONS]
}

function saveStoredApplications(apps: SellerApplication[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
  } catch {
    // ignore
  }
}

export const adminShopApi = {
  /**
   * Lấy danh sách hồ sơ đăng ký gian hàng
   */
  async getApplications(status?: string, page: number = 1, size: number = 20): Promise<SellerApplication[]> {
    try {
      const params: Record<string, any> = { page, size }
      if (status && status !== 'ALL') {
        params.status = status
      }
      const response = await httpClient.get<SellerApplication[]>('/seller-applications', { params })
      if (response.data && response.data.length > 0) {
        return response.data
      }
    } catch (err) {
      console.warn('Backend API /seller-applications unavailable or empty, falling back to local dataset.', err)
    }

    // Fallback to rich demo data
    const all = getStoredApplications()
    if (!status || status === 'ALL') {
      return all
    }
    return all.filter((app) => app.status === status)
  },

  /**
   * Quản trị viên duyệt hoặc từ chối hồ sơ đăng ký
   */
  async reviewApplication(
    id: string,
    request: ReviewApplicationRequest
  ): Promise<SellerApplication> {
    const normalizedStatus =
      request.status === 'APPROVE' ? 'APPROVED' : request.status === 'REJECT' ? 'REJECTED' : request.status

    try {
      const response = await httpClient.put<SellerApplication>(`/seller-applications/${id}/review`, {
        status: normalizedStatus,
        rejectionReason: request.rejectionReason,
      })
      if (response.data) {
        return response.data
      }
    } catch (err) {
      console.warn(`Backend review failed for ${id}, updating local storage state.`, err)
    }

    // Local fallback update
    const all = getStoredApplications()
    const index = all.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error(`Không tìm thấy hồ sơ mã: ${id}`)
    }

    const updated: SellerApplication = {
      ...all[index],
      status: normalizedStatus as 'APPROVED' | 'REJECTED',
      rejectionReason: normalizedStatus === 'REJECTED' ? request.rejectionReason : undefined,
      reviewedAt: new Date().toISOString(),
      adminResponseId: 'adm-super-admin',
    }

    all[index] = updated
    saveStoredApplications(all)

    try {
      recordAuditLogMock({
        action: normalizedStatus === 'APPROVED' ? 'APPROVE_SELLER' : 'REJECT_SELLER',
        targetType: 'SELLER_APPLICATION',
        targetId: id,
        detail: normalizedStatus === 'APPROVED'
          ? `Duyệt hồ sơ đăng ký người bán cho: ${updated.shopName}`
          : `Từ chối hồ sơ đăng ký người bán: ${updated.shopName}. Lý do: ${request.rejectionReason || 'Hồ sơ không đáp ứng tiêu chuẩn'}`
      })
    } catch (e) {
      console.warn('Lỗi ghi audit log mock:', e)
    }

    return updated
  },

  /**
   * Reset dữ liệu demo về trạng thái ban đầu
   */
  resetDemoData(): SellerApplication[] {
    saveStoredApplications([...INITIAL_DEMO_APPLICATIONS])
    return [...INITIAL_DEMO_APPLICATIONS]
  },
}
