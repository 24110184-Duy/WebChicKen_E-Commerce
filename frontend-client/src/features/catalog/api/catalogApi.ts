import type { Category, Product, ProductFilter } from '../types/catalogTypes'
import { httpClient } from '../../../shared/api/httpClient'

export const MOCK_CATEGORIES: Category[] = []

export const MOCK_PRODUCTS: Product[] = []

export const catalogApi = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await httpClient.get<Category[]>('/categories')
      if (res.data && Array.isArray(res.data)) return res.data
    } catch {
      // fallback
    }
    return []
  },

  getProducts: async (filter?: ProductFilter): Promise<{ items: Product[]; total: number }> => {
    try {
      const params = new URLSearchParams()
      if (filter?.query) params.set('q', filter.query)
      if (filter?.categoryId) params.set('categoryId', filter.categoryId)
      if (filter?.storeId) params.set('storeId', filter.storeId)
      if (filter?.minPriceMinor !== undefined) params.set('minPrice', String(filter.minPriceMinor))
      if (filter?.maxPriceMinor !== undefined) params.set('maxPrice', String(filter.maxPriceMinor))
      if (filter?.sort) params.set('sort', filter.sort)
      if (filter?.page) params.set('page', String(filter.page))
      if (filter?.size) params.set('size', String(filter.size))

      const res = await httpClient.get<{ items: Product[]; total: number }>(`/products?${params.toString()}`)
      if (res.data && Array.isArray(res.data.items)) {
        return res.data
      }
    } catch {
      // fallback
    }
    return { items: [], total: 0 }
  },

  getProductDetail: async (id: string): Promise<Product | null> => {
    try {
      const res = await httpClient.get<Product>(`/products/${id}`)
      if (res.data) return res.data
    } catch {
      // fallback
    }
    return null
  },
}
