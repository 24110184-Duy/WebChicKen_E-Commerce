import { httpClient } from './httpClient'

export interface MediaUploadResponseData {
  id: string
  fileName: string
  fileUrl: string
  contentType: string
  fileSize: number
  createdAt: string
}

export const mediaApi = {
  /**
   * Tải một tệp ảnh lên máy chủ (POST /api/v1/media/upload).
   * @param file Tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF tối đa 5MB)
   * @returns Đường dẫn tệp ảnh tĩnh trên máy chủ (ví dụ: /api/v1/media/files/{uuid}.png)
   */
  uploadImage: async (file: File): Promise<string> => {
    if (!file) {
      throw new Error('Vui lòng chọn tệp hình ảnh để tải lên.')
    }

    // Kiểm tra định dạng
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']

    if (!validMimes.includes(file.type) && !validExts.includes(ext)) {
      throw new Error('Chỉ hỗ trợ định dạng hình ảnh JPG, PNG, WEBP hoặc GIF.')
    }

    // Kiểm tra dung lượng (tối đa 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new Error('Dung lượng hình ảnh vượt quá giới hạn cho phép (Tối đa 5MB).')
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = await httpClient.post<MediaUploadResponseData>('/media/upload', formData)
    if (!res.data?.fileUrl) {
      throw new Error('Máy chủ không trả về đường dẫn tệp ảnh hợp lệ.')
    }

    return res.data.fileUrl
  },

  /**
   * Tải hàng loạt tệp ảnh lên máy chủ.
   * @param files Danh sách tệp hình ảnh
   * @returns Mảng các URL ảnh đã tải lên thành công
   */
  uploadImages: async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) return []

    const results: string[] = []
    for (const file of files) {
      try {
        const url = await mediaApi.uploadImage(file)
        if (url) {
          results.push(url)
        }
      } catch (err: any) {
        console.error(`[mediaApi] Lỗi tải file ${file.name}:`, err)
        throw new Error(`Lỗi tải ảnh "${file.name}": ${err?.message || 'Không thể tải lên máy chủ'}`)
      }
    }
    return results
  },
}
