import { httpClient } from '../../../shared/api/httpClient'

export interface CategoryItem {
  id: string
  name: string
  description?: string
  createdAt?: string
}

export const adminCategoryApi = {
  /**
   * Lấy toàn bộ danh mục sản phẩm từ hệ sinh thái (GET /api/v1/categories)
   */
  async getCategories(): Promise<CategoryItem[]> {
    try {
      const response = await httpClient.get<CategoryItem[]>('/categories')
      if (response.data && Array.isArray(response.data)) {
        return response.data
      }
    } catch (err) {
      console.warn('Lỗi khi lấy danh sách danh mục từ server:', err)
    }
    return []
  },

  /**
   * Thêm mới danh mục sản phẩm (POST /api/v1/categories)
   */
  async createCategory(data: { name: string; description?: string }): Promise<CategoryItem> {
    const response = await httpClient.post<CategoryItem>('/categories', data)
    if (!response.data) {
      throw new Error('Thêm danh mục không thành công.')
    }
    return response.data
  },

  /**
   * Cập nhật danh mục sản phẩm (PUT /api/v1/categories/{id})
   */
  async updateCategory(id: string, data: { name: string; description?: string }): Promise<CategoryItem> {
    const response = await httpClient.put<CategoryItem>(`/categories/${id}`, data)
    if (!response.data) {
      throw new Error('Cập nhật danh mục không thành công.')
    }
    return response.data
  },

  /**
   * Xóa danh mục sản phẩm (DELETE /api/v1/categories/{id})
   */
  async deleteCategory(id: string): Promise<void> {
    await httpClient.delete(`/categories/${id}`)
  },
}
