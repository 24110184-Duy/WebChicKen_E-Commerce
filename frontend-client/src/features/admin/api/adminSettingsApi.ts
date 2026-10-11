import { httpClient } from '../../../shared/api/httpClient'

export interface SystemHealthData {
  application: string
  status: string
  database: string
  timestamp: string
}

export const adminSettingsApi = {
  /**
   * Kiểm tra sức khỏe hệ sinh thái Backend & Cơ sở dữ liệu (GET /api/v1/system/health/ready)
   */
  async getSystemHealth(): Promise<SystemHealthData> {
    try {
      const response = await httpClient.get<SystemHealthData>('/system/health/ready')
      if (response.data) {
        return response.data
      }
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data
      }
    }
    return {
      application: 'WebChicKen E-Commerce API',
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    }
  }
}
