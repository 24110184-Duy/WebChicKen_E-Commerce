import { httpClient } from '../../../shared/api/httpClient'
import type { AdminProductItem, ReviewProductRequest } from '../types'

export const adminProductApi = {
  /**
   * Lấy danh sách sản phẩm quản trị trực tiếp từ CSDL backend
   */
  async getProducts(params?: {
    status?: string
    page?: number
    size?: number
    q?: string
  }): Promise<{ items: AdminProductItem[]; total: number }> {
    try {
      const response = await httpClient.get<any>('/products', {
        params: {
          status: params?.status && params.status !== 'ALL' ? params.status : undefined,
          page: params?.page ?? 1,
          size: params?.size ?? 50,
          q: params?.q
        }
      })

      if (response.data && Array.isArray(response.data.items)) {
        const mapped: AdminProductItem[] = response.data.items.map((p: any) => ({
          id: p.id,
          storeId: p.storeId,
          storeName: p.storeName || 'Gian Hàng Đối Tác',
          categoryId: p.categoryId,
          categoryName: p.categoryName || 'Nông Sản & Thực Phẩm',
          name: p.name,
          description: p.description,
          status: p.status,
          rejectionReason: p.rejectionReason,
          thumbnailUrl: p.thumbnailUrl,
          minPriceMinor: p.minPriceMinor,
          maxPriceMinor: p.maxPriceMinor,
          totalStock: p.totalStock,
          createdAt: p.createdAt
        }))
        return { items: mapped, total: response.data.total ?? mapped.length }
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách sản phẩm quản trị từ máy chủ:', err)
    }

    return { items: [], total: 0 }
  },

  /**
   * Phê duyệt (ACTIVE) hoặc Từ chối (INACTIVE) sản phẩm (PUT /api/v1/products/{id}/review)
   */
  async reviewProduct(id: string, request: ReviewProductRequest): Promise<AdminProductItem> {
    const response = await httpClient.put<any>(`/products/${id}/review`, request)
    if (!response.data) {
      throw new Error(`Kiểm duyệt sản phẩm ${id} không thành công.`)
    }
    const p = response.data
    return {
      id: p.id,
      storeId: p.storeId,
      storeName: p.storeName || 'Gian Hàng Đối Tác',
      categoryId: p.categoryId,
      categoryName: p.categoryName || 'Nông Sản & Thực Phẩm',
      name: p.name,
      description: p.description,
      status: p.status,
      rejectionReason: p.rejectionReason,
      thumbnailUrl: p.thumbnailUrl,
      minPriceMinor: p.minPriceMinor,
      maxPriceMinor: p.maxPriceMinor,
      totalStock: p.totalStock,
      createdAt: p.createdAt
    }
  },
}
