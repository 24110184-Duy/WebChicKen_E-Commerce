import { httpClient } from '../../../shared/api/httpClient'
import type { AdminProductItem, ReviewProductRequest } from '../types'
import { recordAuditLogMock } from './adminAuditApi'

// Mock dữ liệu kiểm duyệt sản phẩm thực tế cho WebChicKen Marketplace
const INITIAL_DEMO_PRODUCTS: AdminProductItem[] = [
  {
    id: 'prod-mod-001',
    storeId: 'store-yenthe-01',
    storeName: 'Trang Trại Gà Đồi Yên Thế - Bắc Giang',
    categoryId: 'cat-ga-ta',
    categoryName: 'Gà Ta Thả Vườn & Gà Đồi',
    name: 'Gà Đồi Yên Thế Bắc Giang Làm Sạch (Nguyên Con 1.4kg - 1.6kg)',
    description: 'Gà đồi Yên Thế được nuôi thả tự nhiên trên sườn đồi, thịt săn chắc, thơm ngọt, da vàng óng tự nhiên. Đã được sơ chế làm sạch, đóng gói hút chân không và bảo quản lạnh tiêu chuẩn VietGAP.',
    status: 'PENDING_APPROVAL',
    thumbnailUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80'
    ],
    minPriceMinor: 18500000, // 185.000 đ
    maxPriceMinor: 21500000, // 215.000 đ
    totalStock: 85,
    variants: [
      { id: 'var-001-a', attribute: 'Size M (1.3kg - 1.4kg)', basePriceMinor: 18500000, stockQuantity: 40 },
      { id: 'var-001-b', attribute: 'Size L (1.5kg - 1.6kg)', basePriceMinor: 21500000, stockQuantity: 45 }
    ],
    createdAt: '2026-10-06T10:15:00Z',
    origin: 'Huyện Yên Thế, Tỉnh Bắc Giang',
    farmingStandard: 'VietGAP Chăn Nuôi An Toàn Sinh Học',
    veterinaryInspectionCode: 'KD-BG-2026-9912'
  },
  {
    id: 'prod-mod-002',
    storeId: 'store-vandinh-02',
    storeName: 'Nông Trại Vịt Cỏ Vân Đình - Hà Tây',
    categoryId: 'cat-vit-co',
    categoryName: 'Vịt Cỏ & Vịt Bầu Thả Đồng',
    name: 'Vịt Cỏ Thả Đồng Vân Đình Tươi Sống Hút Chân Không (1.8kg - 2.0kg)',
    description: 'Vịt cỏ ăn ốc, thóc và côn trùng tự nhiên trên cánh đồng ngập nước Vân Đình. Thịt nạc dày, ít mỡ, xương nhỏ, vị ngọt đậm đà truyền thống. Kiểm định kiểm dịch đầy đủ.',
    status: 'PENDING_APPROVAL',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?auto=format&fit=crop&w=800&q=80'
    ],
    minPriceMinor: 14000000, // 140.000 đ
    maxPriceMinor: 16500000, // 165.000 đ
    totalStock: 120,
    variants: [
      { id: 'var-002-a', attribute: 'Nguyên con chưa mổ sẵn', basePriceMinor: 14000000, stockQuantity: 50 },
      { id: 'var-002-b', attribute: 'Mổ sẵn kèm lòng mề tươi', basePriceMinor: 16500000, stockQuantity: 70 }
    ],
    createdAt: '2026-10-06T14:40:00Z',
    origin: 'Huyện Ứng Hòa, TP Hà Nội',
    farmingStandard: 'Vệ Sinh An Toàn Thực Phẩm Chuỗi Khép Kín',
    veterinaryInspectionCode: 'KD-HN-TY-2026-3381'
  },
  {
    id: 'prod-mod-003',
    storeId: 'store-bavi-03',
    storeName: 'Hợp Tác Xã Gia Cầm Hữu Cơ Ba Vì',
    categoryId: 'cat-trung-ga',
    categoryName: 'Trứng Gia Cầm Sạch',
    name: 'Hộp 30 Quả Trứng Gà Thảo Dược Hữu Cơ Ba Vì (Giàu Omega-3 & DHA)',
    description: 'Gà đẻ được cho ăn thức ăn phối trộn ngô non hữu cơ, bột sâm, trùn quế và các vị thảo mộc thiên nhiên. Lòng đỏ màu vàng cam đậm đà, không tanh, hàm lượng vitamin cao.',
    status: 'PENDING_APPROVAL',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80'
    ],
    minPriceMinor: 12000000, // 120.000 đ
    maxPriceMinor: 12000000,
    totalStock: 350,
    variants: [
      { id: 'var-003-a', attribute: 'Hộp 30 quả (Vỉ chống sốc)', basePriceMinor: 12000000, stockQuantity: 350 }
    ],
    createdAt: '2026-10-06T16:20:00Z',
    origin: 'Xã Ba Trại, Huyện Ba Vì, Hà Nội',
    farmingStandard: 'HACCP & Organic Poultry Standard',
    veterinaryInspectionCode: 'KD-BV-2026-8802'
  },
  {
    id: 'prod-mod-004',
    storeId: 'store-yenthe-01',
    storeName: 'Trang Trại Gà Đồi Yên Thế - Bắc Giang',
    categoryId: 'cat-ga-ta',
    categoryName: 'Gà Ta Thả Vườn & Gà Đồi',
    name: 'Gà Mía Sơn Tây Tiến Vua Thả Đồi (Con 1.8kg - 2.2kg)',
    description: 'Gà mía Sơn Tây chính gốc, chân vàng, da giòn, thớ thịt ngọt lịm chắc nịch.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 23000000,
    maxPriceMinor: 25000000,
    totalStock: 60,
    createdAt: '2026-10-04T08:00:00Z',
    origin: 'Thị Xã Sơn Tây, Hà Nội',
    farmingStandard: 'VietGAP',
    veterinaryInspectionCode: 'KD-HN-ST-2026-1011'
  },
  {
    id: 'prod-mod-005',
    storeId: 'store-dongtao-04',
    storeName: 'Trại Gà Đông Tảo Thuần Chủng Khoái Châu',
    categoryId: 'cat-ga-quy',
    categoryName: 'Gia Cầm Đặc Sản Quý Hiếm',
    name: 'Gà Đông Tảo Chân Rồng Biếu Tết (Con 3.5kg - 4.2kg)',
    description: 'Gà Đông Tảo giống thuần chủng F1 chân vảy rồng to xù xì, nuôi dưỡng trên 12 tháng.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 150000000, // 1.500.000 đ
    maxPriceMinor: 220000000, // 2.200.000 đ
    totalStock: 15,
    createdAt: '2026-10-02T11:00:00Z',
    origin: 'Huyện Khoái Châu, Tỉnh Hưng Yên',
    farmingStandard: 'Tiêu Chuẩn Giống Quốc Gia',
    veterinaryInspectionCode: 'KD-HY-2026-0044'
  },
  {
    id: 'prod-mod-006',
    storeId: 'store-unknown-05',
    storeName: 'Đại Lý Thực Phẩm Nhanh Giá Rẻ',
    categoryId: 'cat-ga-dong-lanh',
    categoryName: 'Gia Cầm Đông Lạnh',
    name: 'Đùi Gà Đông Lạnh Nhập Khẩu Không Rõ Nhãn Mác (Thùng 10kg)',
    description: 'Đùi gà đông lạnh giá rẻ đóng bao xá, không có tem phụ tiếng Việt và chứng nhận kiểm dịch thú y.',
    status: 'INACTIVE',
    rejectionReason: 'Sản phẩm không có nguồn gốc xuất xứ rõ ràng, thiếu chứng nhận kiểm dịch an toàn thực phẩm theo quy chuẩn của sàn.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    minPriceMinor: 25000000,
    maxPriceMinor: 25000000,
    totalStock: 0,
    createdAt: '2026-10-03T15:30:00Z',
    origin: 'Chưa xác thực',
    farmingStandard: 'Không đạt tiêu chuẩn kiểm duyệt'
  }
]

const STORAGE_KEY = 'webchicken_admin_products_moderation'

function getStoredProducts(): AdminProductItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PRODUCTS))
      return INITIAL_DEMO_PRODUCTS
    }
    return JSON.parse(raw)
  } catch (e) {
    return INITIAL_DEMO_PRODUCTS
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

      if (response.data && Array.isArray(response.data.items) && response.data.items.length > 0) {
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
        return { items: mapped, total: response.data.total || mapped.length }
      }
    } catch (err) {
      console.warn('Backend API /products unavailable or empty, falling back to local dataset.', err)
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
