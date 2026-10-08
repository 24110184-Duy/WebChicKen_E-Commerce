import { httpClient } from '../../../shared/api/httpClient'
import type { SellerApplication, ReviewApplicationRequest } from '../types'
import { recordAuditLogMock } from './adminAuditApi'

// Danh sách hồ sơ đăng ký gian hàng khởi tạo rỗng
const INITIAL_DEMO_APPLICATIONS: SellerApplication[] = []

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
  return []
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
      if (response.data && Array.isArray(response.data)) {
        return response.data
      }
    } catch (err) {
      console.warn('Backend API /seller-applications unavailable, falling back to local dataset.', err)
    }

    // Fallback to local data
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
