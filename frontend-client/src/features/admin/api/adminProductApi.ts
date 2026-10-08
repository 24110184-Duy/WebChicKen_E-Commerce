import { httpClient } from '../../../shared/api/httpClient'
import type { AdminProductItem, ReviewProductRequest } from '../types'
import { recordAuditLogMock } from './adminAuditApi'

// Danh sách sản phẩm kiểm duyệt ban đầu rỗng (sử dụng dữ liệu thực từ database)
const INITIAL_DEMO_PRODUCTS: AdminProductItem[] = []

const STORAGE_KEY = 'webchicken_admin_products_moderation'

function getStoredProducts(): AdminProductItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

function saveStoredProducts(list: AdminProductItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Cannot save admin products to localStorage:', e)
  }
}

export const adminProductApi = {
  /**
   * Lấy danh sách sản phẩm quản trị (kết hợp API backend và local dataset fallback)
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
        // Ánh xạ DTO sang AdminProductItem
        const mapped: AdminProductItem[] = response.data.items.map((p: any) => ({
          id: p.id,
          storeId: p.storeId,
          storeName: p.storeName || 'Nông Trại Thành Viên',
          categoryId: p.categoryId,
          categoryName: p.categoryName || 'Gia Cầm Tươi Sạch',
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
      console.warn('Backend API /products unavailable, falling back to local dataset.', err)
    }

    // Local Fallback Dataset
    const all = getStoredProducts()
    let filtered = all

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === params.status)
    }

    if (params?.q && params.q.trim()) {
      const query = params.q.toLowerCase().trim()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.storeName?.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query) ||
          p.farmingStandard?.toLowerCase().includes(query)
      )
    }

    return { items: filtered, total: filtered.length }
  },

  /**
   * Phê duyệt (ACTIVE) hoặc Từ chối (INACTIVE) sản phẩm
   */
  async reviewProduct(id: string, request: ReviewProductRequest): Promise<AdminProductItem> {
    try {
      const response = await httpClient.put<any>(`/products/${id}/review`, request)
      if (response.data) {
        // Cập nhật lại cache local
        const all = getStoredProducts()
        const idx = all.findIndex((x) => x.id === id)
        if (idx !== -1) {
          all[idx] = {
            ...all[idx],
            status: request.status,
            rejectionReason: request.status === 'INACTIVE' ? request.rejectionReason : undefined,
            updatedAt: new Date().toISOString()
          }
          saveStoredProducts(all)
        }
        return response.data
      }
    } catch (err) {
      console.warn(`Backend review failed for product ${id}, falling back to local store update.`, err)
    }

    // Fallback cập nhật local
    const all = getStoredProducts()
    const index = all.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error(`Không tìm thấy sản phẩm mã: ${id}`)
    }

    const updated: AdminProductItem = {
      ...all[index],
      status: request.status,
      rejectionReason: request.status === 'INACTIVE' ? request.rejectionReason : undefined,
      updatedAt: new Date().toISOString()
    }

    all[index] = updated
    saveStoredProducts(all)

    try {
      recordAuditLogMock({
        action: request.status === 'ACTIVE' ? 'APPROVE_PRODUCT' : 'REJECT_PRODUCT',
        targetType: 'PRODUCT',
        targetId: id,
        detail: request.status === 'ACTIVE'
          ? `Duyệt mở bán sản phẩm: ${updated.name}`
          : `Từ chối duyệt sản phẩm: ${updated.name}. Lý do: ${request.rejectionReason || 'Không đạt chuẩn'}`
      })
    } catch (e) {
      console.warn('Lỗi ghi audit log mock:', e)
    }

    return updated
  },

  /**
   * Khôi phục dữ liệu mẫu
   */
  resetDemoData(): AdminProductItem[] {
    saveStoredProducts([...INITIAL_DEMO_PRODUCTS])
    return [...INITIAL_DEMO_PRODUCTS]
  }
}
