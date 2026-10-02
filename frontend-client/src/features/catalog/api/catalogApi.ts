import type { Category, Product, ProductFilter } from '../types/catalogTypes'
import { httpClient } from '../../../shared/api/httpClient'

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Fresh Whole Chicken', description: 'Certified farm-raised fresh chickens', productCount: 24 },
  { id: 'cat-2', name: 'Chicken Cuts & Fillets', description: 'Boneless breasts, thighs, wings, and drumsticks', productCount: 38 },
  { id: 'cat-3', name: 'Organic Herbal Poultry', description: 'Pasture-raised chickens fed with natural herbs', productCount: 16 },
  { id: 'cat-4', name: 'Fresh Farm Eggs', description: 'Omega-3 rich, organic, and free-range fresh eggs', productCount: 19 },
  { id: 'cat-5', name: 'Ready-to-Cook & Marinated', description: 'BBQ wings, herb-seasoned fillets, and crispy tenders', productCount: 29 },
  { id: 'cat-6', name: 'Smoked & Cured Deli', description: 'Smoked chicken breasts, sausages, and deli cold cuts', productCount: 12 },
  { id: 'cat-7', name: 'Bulk Wholesale Packages', description: 'Cost-saving packages for families and catering', productCount: 8 },
]

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    categoryId: 'cat-1',
    categoryName: 'Fresh Whole Chicken',
    name: 'Premium Free-Range Whole Chicken (Huy Hieu Vang)',
    description: 'Fresh whole chicken raised with natural grains and free-range freedom. Meat is firm, aromatic, and low in cholesterol. Vacuum-packed fresh daily under strict HACCP safety standards.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-1-1', productId: 'prod-1', attribute: '1.2 kg - 1.4 kg', basePriceMinor: 145000, stockQuantity: 45 },
      { id: 'var-1-2', productId: 'prod-1', attribute: '1.5 kg - 1.7 kg', basePriceMinor: 175000, stockQuantity: 30 },
      { id: 'var-1-3', productId: 'prod-1', attribute: '1.8 kg - 2.0 kg', basePriceMinor: 205000, stockQuantity: 20 },
    ],
    minPriceMinor: 145000,
    maxPriceMinor: 205000,
    totalStock: 95,
    rating: 4.9,
    ratingCount: 312,
    soldCount: 1280,
    isFlashDeal: true,
    discountPercent: 15,
    createdAt: '2026-09-15T08:00:00Z',
  },
  {
    id: 'prod-2',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    categoryId: 'cat-2',
    categoryName: 'Chicken Cuts & Fillets',
    name: 'Skinless Boneless Chicken Breast Fillet (500g)',
    description: 'High-protein, extra-lean chicken breasts. Ideal for gym enthusiasts, healthy meal prep, and clean-eating diets. Fresh chilled, never frozen.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-2-1', productId: 'prod-2', attribute: 'Tray 500g', basePriceMinor: 65000, stockQuantity: 80 },
      { id: 'var-2-2', productId: 'prod-2', attribute: 'Twin Pack 1kg', basePriceMinor: 120000, stockQuantity: 50 },
    ],
    minPriceMinor: 65000,
    maxPriceMinor: 120000,
    totalStock: 130,
    rating: 4.8,
    ratingCount: 540,
    soldCount: 3200,
    isFlashDeal: true,
    discountPercent: 20,
    createdAt: '2026-09-18T08:00:00Z',
  },
  {
    id: 'prod-3',
    storeId: 'store-2',
    storeName: 'Highland Organic Co.',
    categoryId: 'cat-3',
    categoryName: 'Organic Herbal Poultry',
    name: 'Highland Herbal Free-Range Black Bone Chicken',
    description: 'Traditional silky black bone chicken raised on mountain herbs like ginseng and goji berries. Excellent for nourishing soups, stamina enhancement, and traditional health remedies.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-3-1', productId: 'prod-3', attribute: 'Whole Bird (~1.1kg)', basePriceMinor: 195000, stockQuantity: 25 },
      { id: 'var-3-2', productId: 'prod-3', attribute: 'Pack with Stew Herbs', basePriceMinor: 235000, stockQuantity: 18 },
    ],
    minPriceMinor: 195000,
    maxPriceMinor: 235000,
    totalStock: 43,
    rating: 5.0,
    ratingCount: 142,
    soldCount: 450,
    isFlashDeal: false,
    createdAt: '2026-09-20T08:00:00Z',
  },
  {
    id: 'prod-4',
    storeId: 'store-3',
    storeName: 'Golden Yolk Organic',
    categoryId: 'cat-4',
    categoryName: 'Fresh Farm Eggs',
    name: 'Organic Pasture-Raised Brown Eggs (Carton of 10)',
    description: 'Farm-fresh eggs from healthy hens fed certified non-GMO feed with rich golden yolks. Packed with Vitamin D and Omega-3.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-4-1', productId: 'prod-4', attribute: 'Box 10 Eggs', basePriceMinor: 42000, stockQuantity: 150 },
      { id: 'var-4-2', productId: 'prod-4', attribute: 'Box 30 Eggs', basePriceMinor: 115000, stockQuantity: 80 },
    ],
    minPriceMinor: 42000,
    maxPriceMinor: 115000,
    totalStock: 230,
    rating: 4.9,
    ratingCount: 890,
    soldCount: 4800,
    isFlashDeal: true,
    discountPercent: 10,
    createdAt: '2026-09-10T08:00:00Z',
  },
  {
    id: 'prod-5',
    storeId: 'store-1',
    storeName: 'Chicky Farm Direct',
    categoryId: 'cat-2',
    categoryName: 'Chicken Cuts & Fillets',
    name: 'Fresh Chicken Drumsticks Pack (500g)',
    description: 'Juicy, plump chicken drumsticks. Perfect for frying, roasting, or simmering in savory curry sauce. Trimmed and ready to cook.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527477321055-43615b6294a5?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1527477321055-43615b6294a5?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-5-1', productId: 'prod-5', attribute: 'Pack 500g (3-4 pcs)', basePriceMinor: 48000, stockQuantity: 90 },
      { id: 'var-5-2', productId: 'prod-5', attribute: 'Economy Pack 1kg', basePriceMinor: 89000, stockQuantity: 60 },
    ],
    minPriceMinor: 48000,
    maxPriceMinor: 89000,
    totalStock: 150,
    rating: 4.7,
    ratingCount: 420,
    soldCount: 2100,
    isFlashDeal: false,
    createdAt: '2026-09-22T08:00:00Z',
  },
  {
    id: 'prod-6',
    storeId: 'store-4',
    storeName: 'Chef Chicky Kitchen',
    categoryId: 'cat-5',
    categoryName: 'Ready-to-Cook & Marinated',
    name: 'Honey Glazed Marinated Chicken Wings (500g)',
    description: 'Middle-joint chicken wings marinated in chef-crafted natural honey and roasted garlic glaze. Simply air fry for 15 minutes for restaurant-quality crispy wings.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-6-1', productId: 'prod-6', attribute: 'Mild Honey Glaze (500g)', basePriceMinor: 78000, stockQuantity: 40 },
      { id: 'var-6-2', productId: 'prod-6', attribute: 'Spicy Honey Glaze (500g)', basePriceMinor: 82000, stockQuantity: 35 },
    ],
    minPriceMinor: 78000,
    maxPriceMinor: 82000,
    totalStock: 75,
    rating: 4.9,
    ratingCount: 260,
    soldCount: 1450,
    isFlashDeal: true,
    discountPercent: 12,
    createdAt: '2026-09-25T08:00:00Z',
  },
  {
    id: 'prod-7',
    storeId: 'store-4',
    storeName: 'Chef Chicky Kitchen',
    categoryId: 'cat-5',
    categoryName: 'Ready-to-Cook & Marinated',
    name: 'Crispy Breaded Golden Chicken Tenders (400g)',
    description: 'Crispy panko-breaded tenders made with 100% whole breast meat. No artificial binders or fillers. Kids love them!',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-7-1', productId: 'prod-7', attribute: 'Original Golden (400g)', basePriceMinor: 69000, stockQuantity: 65 },
      { id: 'var-7-2', productId: 'prod-7', attribute: 'Spicy Paprika (400g)', basePriceMinor: 72000, stockQuantity: 45 },
    ],
    minPriceMinor: 69000,
    maxPriceMinor: 72000,
    totalStock: 110,
    rating: 4.8,
    ratingCount: 310,
    soldCount: 1600,
    isFlashDeal: false,
    createdAt: '2026-09-28T08:00:00Z',
  },
  {
    id: 'prod-8',
    storeId: 'store-2',
    storeName: 'Highland Organic Co.',
    categoryId: 'cat-6',
    categoryName: 'Smoked & Cured Deli',
    name: 'Applewood Smoked Farm Chicken Breast (300g)',
    description: 'Slow-smoked over genuine applewood chips for 6 hours. Tender, juicy with subtle woody aroma. Sliced thin for sandwiches and fresh salads.',
    status: 'ACTIVE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'var-8-1', productId: 'prod-8', attribute: 'Vacuum Pack 300g', basePriceMinor: 95000, stockQuantity: 30 },
      { id: 'var-8-2', productId: 'prod-8', attribute: 'Twin Pack 600g', basePriceMinor: 180000, stockQuantity: 20 },
    ],
    minPriceMinor: 95000,
    maxPriceMinor: 180000,
    totalStock: 50,
    rating: 4.9,
    ratingCount: 185,
    soldCount: 670,
    isFlashDeal: false,
    createdAt: '2026-09-29T08:00:00Z',
  },
]

export const catalogApi = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await httpClient.get<Category[]>('/categories')
      if (res.data && res.data.length > 0) return res.data
    } catch {
      // fallback to mock
    }
    return MOCK_CATEGORIES
  },

  getProducts: async (filter?: ProductFilter): Promise<{ items: Product[]; total: number }> => {
    try {
      const params = new URLSearchParams()
      if (filter?.query) params.set('q', filter.query)
      if (filter?.categoryId) params.set('categoryId', filter.categoryId)
      if (filter?.minPriceMinor) params.set('minPrice', String(filter.minPriceMinor))
      if (filter?.maxPriceMinor) params.set('maxPrice', String(filter.maxPriceMinor))
      if (filter?.sort) params.set('sort', filter.sort)
      if (filter?.page) params.set('page', String(filter.page))
      if (filter?.size) params.set('size', String(filter.size))

      const res = await httpClient.get<{ items: Product[]; total: number }>(`/products?${params.toString()}`)
      if (res.data && res.data.items && res.data.items.length > 0) {
        return res.data
      }
    } catch {
      // fallback
    }

    // Filter mock data locally
    let list = [...MOCK_PRODUCTS]
    if (filter?.query) {
      const q = filter.query.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    if (filter?.categoryId) {
      list = list.filter(p => p.categoryId === filter.categoryId)
    }
    if (filter?.minPriceMinor !== undefined) {
      list = list.filter(p => p.minPriceMinor >= filter.minPriceMinor!)
    }
    if (filter?.maxPriceMinor !== undefined) {
      list = list.filter(p => p.minPriceMinor <= filter.maxPriceMinor!)
    }
    if (filter?.sort === 'price_asc') {
      list.sort((a, b) => a.minPriceMinor - b.minPriceMinor)
    } else if (filter?.sort === 'price_desc') {
      list.sort((a, b) => b.minPriceMinor - a.minPriceMinor)
    } else if (filter?.sort === 'top_rated') {
      list.sort((a, b) => b.rating - a.rating)
    } else if (filter?.sort === 'popular') {
      list.sort((a, b) => b.soldCount - a.soldCount)
    }

    return { items: list, total: list.length }
  },

  getProductDetail: async (id: string): Promise<Product | null> => {
    try {
      const res = await httpClient.get<Product>(`/products/${id}`)
      if (res.data) return res.data
    } catch {
      // fallback
    }
    return MOCK_PRODUCTS.find(p => p.id === id) || null
  },
}
