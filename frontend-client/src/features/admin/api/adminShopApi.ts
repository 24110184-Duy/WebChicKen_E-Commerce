import { httpClient } from '../../../shared/api/httpClient'
import type { SellerApplication, ReviewApplicationRequest } from '../types'

export const adminShopApi = {
  /**
   * Lấy danh sách hồ sơ đăng ký gian hàng từ CSDL
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
      console.warn('Lỗi khi lấy danh sách hồ sơ đăng ký gian hàng từ máy chủ:', err)
    }
    return []
  },

  /**
   * Quản trị viên duyệt hoặc từ chối hồ sơ đăng ký (PUT /api/v1/seller-applications/{id}/review)
   */
  async reviewApplication(
    id: string,
    request: ReviewApplicationRequest
  ): Promise<SellerApplication> {
    const normalizedStatus =
      request.status === 'APPROVE' ? 'APPROVED' : request.status === 'REJECT' ? 'REJECTED' : request.status

    const response = await httpClient.put<SellerApplication>(`/seller-applications/${id}/review`, {
      status: normalizedStatus,
      rejectionReason: request.rejectionReason,
    })

    if (!response.data) {
      throw new Error(`Kiểm duyệt hồ sơ ${id} không thành công.`)
    }

    return response.data
  },
}
