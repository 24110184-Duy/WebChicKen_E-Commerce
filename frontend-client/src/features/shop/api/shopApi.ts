import { httpClient } from '../../../shared/api/httpClient'
import type { StoreInfo } from '../types/shopTypes'

export const shopApi = {
  getStoreById: async (storeId: string): Promise<StoreInfo | null> => {
    try {
      const res = await httpClient.get<StoreInfo>(`/stores/${storeId}`)
      if (res.data) return res.data
    } catch {
      // Graceful fallback when endpoint returns error or store doesn't exist
    }
    return null
  },
}
