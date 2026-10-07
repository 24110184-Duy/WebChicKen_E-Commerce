import { httpClient } from '../../../shared/api/httpClient'
import type {
  FeedbackItem,
  FeedbackPageResponse,
  CreateFeedbackPayload,
  RespondFeedbackPayload,
  FeedbackFilterParams
} from '../types/feedbackTypes'
import { recordAuditLogMock } from '../../admin/api/adminAuditApi'

const STORAGE_KEY = 'webchicken_feedbacks_store_v1'

const INITIAL_DEMO_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'fb-ticket-001',
    userId: 'usr-mod-002',
    userEmail: 'hung.yenthefarm@gmail.com',
    shopName: 'Trang Trại Gà Đồi Yên Thế - Bắc Giang',
    type: 'COMPLAINT',
    subject: 'Thời gian xét duyệt lô sản phẩm Gà Đồi VietGAP chậm trễ hơn 48h',
    content: 'Kính gửi Ban Quản trị WebChicKen, chúng tôi đã nộp hồ sơ kiểm định VietGAP kèm lô sản phẩm mới từ 3 ngày trước nhưng đến nay vẫn chưa được kích hoạt bán trên hệ thống. Xin vui lòng hỗ trợ kiểm tra và duyệt gấp để chúng tôi kịp giao hàng cho đối tác.',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    status: 'RESOLVED',
    adminResponse: 'Đội ngũ Kiểm duyệt đã ưu tiên thẩm định chứng chỉ VietGAP của nông trại và kích hoạt trạng thái mở bán thành công. Chân thành xin lỗi quý trang trại vì sự chậm trễ trong đợt cao điểm vừa qua.',
    resolvedBy: 'Super Admin Tổng Quản',
    createdAt: '2026-10-05T09:15:00Z',
    updatedAt: '2026-10-05T14:30:00Z'
  },
  {
    id: 'fb-ticket-002',
    userId: 'usr-seller-003',
    userEmail: 'tiendat.dongtao@gmail.com',
    shopName: 'Gà Đông Tảo Tiến Vua Khoái Châu',
    type: 'INQUIRY',
    subject: 'Hỏi về quy trình kích hoạt vận chuyển hỏa tốc riêng cho gia cầm sống',
    content: 'Xin chào BQT, hiện nông trại chúng tôi cung cấp giống gà Đông Tảo giống và gà biếu tươi sống. Chúng tôi muốn tích hợp đơn vị vận chuyển chuyên dụng trong ngày thì cần cấu hình thêm những giấy phép gì trong phần Cài đặt Shop?',
    imageUrl: '',
    status: 'IN_REVIEW',
    adminResponse: 'Bộ phận Vận hành Sàn đang xem xét và sẽ liên hệ trực tiếp qua số hotline của nông trại để hướng dẫn kích hoạt phương thức Giao Hỏa Tốc liên tỉnh.',
    resolvedBy: 'Trần Thị Thu Thảo (Kiểm duyệt viên)',
    createdAt: '2026-10-06T10:45:00Z',
    updatedAt: '2026-10-06T15:20:00Z'
  },
  {
    id: 'fb-ticket-003',
    userId: 'usr-seller-004',
    userEmail: 'son.miafarm@gmail.com',
    shopName: 'Hợp tác xã Chăn nuôi Gà Mía Sơn Tây',
    type: 'SUGGESTION',
    subject: 'Đề xuất chiến dịch Flash Sale riêng cho nông sản ngày Rằm và Mùng Một',
    content: 'Thị trường có nhu cầu gà ta cúng lễ rất cao vào ngày Rằm và Mùng Một âm lịch hàng tháng. Chúng tôi đề xuất BQT mở thêm chuyên mục Khuyến mại Nông Sản Lễ Hội để các hộ chăn nuôi tiếp cận khách hàng tốt hơn.',
    imageUrl: '',
    status: 'RESOLVED',
    adminResponse: 'Ban Quản trị rất hoan nghênh ý kiến đóng góp thiết thực của HTX! Chúng tôi đã đưa đề xuất này vào kế hoạch Chiến dịch Khuyến mại Tháng 10 và sẽ thông báo sớm đến toàn thể người bán.',
    resolvedBy: 'Super Admin Tổng Quản',
    createdAt: '2026-10-04T08:00:00Z',
    updatedAt: '2026-10-04T16:00:00Z'
  },
  {
    id: 'fb-ticket-004',
    userId: 'usr-seller-005',
    userEmail: 'tanuyen.poultry@gmail.com',
    shopName: 'Trang Trại Gà Tre Tân Uyên',
    type: 'SYSTEM_BUG',
    subject: 'Hình ảnh chứng chỉ kiểm dịch thú y bị nén mờ khi tải lên trang hồ sơ',
    content: 'Khi tôi tải file ảnh chụp Giấy chứng nhận vệ sinh thú y (định dạng JPG, dung lượng 2.5MB), ảnh xem trước trong hồ sơ bị nén độ phân giải thấp khiến nhân viên kiểm duyệt khó đọc mã QR và dấu đỏ. Nhờ kỹ thuật hỗ trợ kiểm tra.',
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    status: 'PENDING',
    adminResponse: '',
    resolvedBy: '',
    createdAt: '2026-10-07T08:30:00Z',
    updatedAt: '2026-10-07T08:30:00Z'
  }
]

function getStoredFeedbacks(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Lỗi khi đọc danh sách phản hồi từ localStorage:', err)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_FEEDBACKS))
  return INITIAL_DEMO_FEEDBACKS
}

function saveFeedbacks(items: FeedbackItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Lỗi khi ghi danh sách phản hồi vào localStorage:', err)
  }
}

/**
 * Seller gửi thắc mắc hoặc khiếu nại mới
 */
export async function submitSellerFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
  // 1. Thử gọi API Backend Servlet
  try {
    const resp = await httpClient.post<FeedbackItem>('/api/v1/seller/feedbacks', payload, {
      headers: {
        'X-User-Id': 'usr-mod-002' // Default seller session identifier
      }
    })
    if (resp.data && resp.data.id) {
      // Đồng bộ vào localStorage
      const current = getStoredFeedbacks()
      saveFeedbacks([resp.data, ...current.filter((item) => item.id !== resp.data.id)])
      return resp.data
    }
  } catch (err) {
    console.info('Backend API chưa sẵn sàng hoặc trả lỗi, sử dụng bộ lưu trữ nội bộ:', err)
  }

  // 2. Fallback xử lý localStorage
  const current = getStoredFeedbacks()
  const newFeedback: FeedbackItem = {
    id: `fb-ticket-${Date.now().toString().slice(-6)}`,
    userId: 'usr-mod-002',
    userEmail: 'hung.yenthefarm@gmail.com',
    shopName: 'Trang Trại Gà Đồi Yên Thế - Bắc Giang',
    type: payload.type,
    subject: payload.subject.trim(),
    content: payload.content.trim(),
    imageUrl: payload.imageUrl?.trim() || '',
    status: 'PENDING',
    adminResponse: '',
    resolvedBy: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const updated = [newFeedback, ...current]
  saveFeedbacks(updated)
  return newFeedback
}

/**
 * Lấy danh sách phản hồi của chính người bán (Seller xem lịch sử)
 */
export async function fetchSellerFeedbacks(page: number = 1, size: number = 10): Promise<FeedbackPageResponse> {
  try {
    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('size', String(size))

    const resp = await httpClient.get<FeedbackPageResponse>(`/api/v1/seller/feedbacks?${query.toString()}`, {
      headers: {
        'X-User-Id': 'usr-mod-002'
      }
    })
    if (resp.data && resp.data.items) {
      return resp.data
    }
  } catch (err) {
    console.info('Backend API seller feedbacks offline, fallback sang local:', err)
  }

  // Fallback lọc theo seller hiện tại (usr-mod-002)
  const all = getStoredFeedbacks()
  const sellerItems = all.filter((item) => item.userId === 'usr-mod-002')
  const total = sellerItems.length
  const totalPages = Math.ceil(total / size) || 1
  const start = (page - 1) * size
  const paginated = sellerItems.slice(start, start + size)

  return {
    items: paginated,
    total,
    page,
    size,
    totalPages
  }
}

/**
 * Admin truy vấn danh sách phản hồi từ các nhà bán
 */
export async function fetchAdminFeedbacks(params: FeedbackFilterParams = {}): Promise<FeedbackPageResponse> {
  const { page = 1, size = 10, status = 'ALL', type = 'ALL', search = '' } = params

  try {
    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('size', String(size))
    if (status && status !== 'ALL') query.set('status', status)
    if (type && type !== 'ALL') query.set('type', type)
    if (search && search.trim()) query.set('search', search.trim())

    const resp = await httpClient.get<FeedbackPageResponse>(`/api/v1/admin/feedbacks?${query.toString()}`, {
      headers: {
        'X-User-Role': 'SUPER_ADMIN'
      }
    })
    if (resp.data && resp.data.items) {
      return resp.data
    }
  } catch (err) {
    console.info('Backend API admin feedbacks offline, fallback sang local dataset:', err)
  }

  // Fallback demo local dataset
  const all = getStoredFeedbacks()
  let filtered = all.filter((item) => {
    if (status !== 'ALL' && item.status !== status) return false
    if (type !== 'ALL' && item.type !== type) return false
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      const matchSub = item.subject.toLowerCase().includes(q)
      const matchShop = (item.shopName || '').toLowerCase().includes(q)
      const matchEmail = (item.userEmail || '').toLowerCase().includes(q)
      const matchId = item.id.toLowerCase().includes(q)
      if (!matchSub && !matchShop && !matchEmail && !matchId) return false
    }
    return true
  })

  // Sắp xếp mới nhất lên đầu
  filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = filtered.length
  const totalPages = Math.ceil(total / size) || 1
  const start = (page - 1) * size
  const paginated = filtered.slice(start, start + size)

  return {
    items: paginated,
    total,
    page,
    size,
    totalPages
  }
}

/**
 * Lấy chi tiết một phản hồi
 */
export async function fetchFeedbackDetail(id: string): Promise<FeedbackItem> {
  try {
    const resp = await httpClient.get<FeedbackItem>(`/api/v1/admin/feedbacks/${id}`, {
      headers: {
        'X-User-Role': 'SUPER_ADMIN'
      }
    })
    if (resp.data && resp.data.id) return resp.data
  } catch (err) {
    console.info('Backend API feedback detail offline, tra cứu local:', err)
  }

  const all = getStoredFeedbacks()
  const found = all.find((item) => item.id === id)
  if (!found) throw new Error(`Không tìm thấy khiếu nại/phản hồi với mã ${id}`)
  return found
}

/**
 * Admin cập nhật trạng thái và phản hồi khiếu nại
 */
export async function respondToFeedback(id: string, payload: RespondFeedbackPayload): Promise<FeedbackItem> {
  const adminName = 'Super Admin Tổng Quản'

  try {
    const resp = await httpClient.put<FeedbackItem>(`/api/v1/admin/feedbacks/${id}/respond`, payload, {
      headers: {
        'X-User-Role': 'SUPER_ADMIN',
        'X-User-Id': 'usr-admin-001'
      }
    })
    if (resp.data && resp.data.id) {
      const current = getStoredFeedbacks()
      saveFeedbacks(current.map((item) => (item.id === id ? resp.data : item)))
      return resp.data
    }
  } catch (err) {
    console.info('Backend API respond feedback offline, cập nhật local dataset:', err)
  }

  // Fallback local update
  const current = getStoredFeedbacks()
  const index = current.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error(`Không tìm thấy khiếu nại với mã ${id}`)
  }

  const existing = current[index]
  const updated: FeedbackItem = {
    ...existing,
    status: payload.status,
    adminResponse: payload.adminResponse.trim(),
    resolvedBy: adminName,
    updatedAt: new Date().toISOString()
  }

  current[index] = updated
  saveFeedbacks(current)

  // Ghi nhật ký kiểm toán vào audit log ledger (TASK-67 reuse)
  try {
    recordAuditLogMock({
      action: 'RESPOND_FEEDBACK',
      targetType: 'FEEDBACK',
      targetId: id,
      detail: `Ban Quản trị đã cập nhật trạng thái [${payload.status}] cho khiếu nại "${existing.subject}" của nhà bán ${existing.shopName || existing.userId}. Nội dung: ${payload.adminResponse}`,
      adminName: adminName,
      adminId: 'usr-admin-001'
    })
  } catch (e) {
    console.warn('Lỗi ghi audit log mô phỏng:', e)
  }

  return updated
}
