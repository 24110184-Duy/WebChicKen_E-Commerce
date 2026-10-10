import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Store, ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { sellerApi, type SellerApplicationResponse } from '../../features/seller/api/sellerApi'
import { PATHS } from '../../app/router/paths'

export const SellerRegisterPage: React.FC = () => {
  const { isSeller } = useAuthStore()
  const navigate = useNavigate()

  const [existingApp, setExistingApp] = useState<SellerApplicationResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [shopName, setShopName] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isSeller) {
      navigate(PATHS.SELLER.PRODUCTS, { replace: true })
      return
    }

    sellerApi.getMyApplication()
      .then((app) => {
        setExistingApp(app)
      })
      .catch((err) => {
        console.warn('Cannot check existing seller application:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isSeller, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!shopName.trim()) {
      setError('Vui lòng nhập tên gian hàng.')
      return
    }

    setSubmitting(true)
    try {
      const res = await sellerApi.applySeller({
        shopName: shopName.trim(),
        taxCode: taxCode.trim() || undefined,
        documentUrl: documentUrl.trim() || undefined,
      })
      setExistingApp(res)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi nộp hồ sơ đăng ký. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%', marginBottom: 20 }}>
        <Link
          to={PATHS.HOME}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#64748b',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          <span>Quay về Trang chủ</span>
        </Link>
      </div>

      <div
        style={{
          maxWidth: 640,
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
            padding: '36px 32px',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: 16,
            }}
          >
            <Store style={{ width: 16, height: 16 }} />
            <span>CHICKYMART SELLER CENTER</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>
            Đăng Ký Trở Thành Người Bán Hàng
          </h1>
          <p style={{ fontSize: 14, opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            Tiếp cận hàng triệu khách hàng trực tuyến, tối ưu quy trình bán hàng nông sản và thực phẩm chất lượng cao.
          </p>
        </div>

        <div style={{ padding: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="cart-spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>Đang kiểm tra hồ sơ đăng ký của bạn...</p>
            </div>
          ) : existingApp && existingApp.status === 'PENDING' ? (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 16,
                padding: '28px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Clock style={{ width: 28, height: 28 }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#92400e', margin: '0 0 8px' }}>
                Hồ Sơ Của Bạn Đang Được Xét Duyệt
              </h3>
              <p style={{ fontSize: 14, color: '#b45309', margin: '0 0 20px', lineHeight: 1.5 }}>
                Gian hàng <strong>"{existingApp.shopName}"</strong> đã được gửi lên hệ thống quản trị. Đội ngũ kiểm duyệt sẽ phản hồi kết quả trong vòng 24 giờ làm việc.
              </p>
              <div
                style={{
                  fontSize: 12,
                  color: '#78350f',
                  backgroundColor: '#fef3c7',
                  padding: '8px 14px',
                  borderRadius: 8,
                  display: 'inline-block',
                }}
              >
                Mã hồ sơ: {existingApp.id} • Ngày gửi: {new Date(existingApp.submittedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ) : existingApp && existingApp.status === 'REJECTED' ? (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 16,
                padding: '24px',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertCircle style={{ width: 22, height: 22, color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', margin: '0 0 4px' }}>
                    Hồ sơ trước đó bị từ chối
                  </h4>
                  <p style={{ fontSize: 13, color: '#b91c1c', margin: '0 0 8px' }}>
                    Lý do: {existingApp.rejectionReason || 'Hồ sơ chưa đạt tiêu chuẩn quy định sàn.'}
                  </p>
                  <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>
                    Bạn có thể cập nhật lại thông tin bên dưới và gửi lại đơn đăng ký mới.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {(!existingApp || existingApp.status === 'REJECTED') && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle2 style={{ width: 18, height: 18 }} />
                  <span>Hồ sơ đã được gửi thành công! Vui lòng chờ Ban quản trị phê duyệt.</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Tên Gian Hàng / Cửa Hàng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ví dụ: Trang Trại Ba Vì, An Phát Poultry Farm..."
                  required
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Mã Số Thuế (Nông hộ / Hộ kinh doanh / Doanh nghiệp)
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  placeholder="Ví dụ: 0312345678"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Đường dẫn giấy chứng nhận VSATTP / Giấy phép kinh doanh (nếu có)
                </label>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  padding: '14px 16px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <ShieldCheck style={{ width: 18, height: 18, color: '#0284c7', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  Bằng việc gửi đăng ký, bạn cam kết tuân thủ chính sách tiêu chuẩn chất lượng sản phẩm và bảo vệ quyền lợi người tiêu dùng của ChickyMart.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 20px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {submitting ? 'Đang gửi hồ sơ...' : 'Nộp Đơn Đăng Ký Người Bán'}
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
