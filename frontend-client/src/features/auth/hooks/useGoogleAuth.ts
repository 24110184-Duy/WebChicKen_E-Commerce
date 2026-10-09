import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../../../app/store/authStore'
import { PATHS } from '../../../app/router/paths'

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '154278717714-ftcl1nhjsgl5hp25bgsmmmpr8qo70okh.apps.googleusercontent.com'

export const useGoogleAuth = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()

  const handleAuthSuccess = useCallback(
    (response: { accessToken: string; user: { userId: string; email?: string; username?: string; phone?: string; fullName: string; logoUrl?: string; roles: string[] } }) => {
      login(
        {
          id: response.user.userId,
          email: response.user.email || response.user.username || response.user.phone || '',
          fullName: response.user.fullName,
          avatarUrl: response.user.logoUrl,
          roles: response.user.roles,
        },
        response.accessToken
      )
      const from = (location.state as { from?: string })?.from || PATHS.HOME
      navigate(from, { replace: true })
    },
    [login, navigate, location.state]
  )

  // Khởi tạo Google One-Tap nếu người dùng đã có phiên Google trong trình duyệt
  useEffect(() => {
    if (!window.google?.accounts?.id) return

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (res) => {
          if (res.credential) {
            setIsGoogleLoading(true)
            setGoogleError(null)
            try {
              const authRes = await authApi.loginWithGoogle(res.credential)
              handleAuthSuccess(authRes)
            } catch (err: unknown) {
              const errObj = err as { message?: string }
              setGoogleError(errObj.message || 'Đăng nhập Google thất bại.')
            } finally {
              setIsGoogleLoading(false)
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Hiển thị prompt One Tap nhẹ nhàng nếu người dùng chưa tương tác
      window.google.accounts.id.prompt()
    } catch (e) {
      // Ignored nếu browser chặn One-Tap
    }
  }, [handleAuthSuccess])

  // Kích hoạt popup chọn tài khoản Google khi người dùng bấm nút "Google"
  const triggerGoogleLogin = useCallback(() => {
    setGoogleError(null)

    if (!window.google?.accounts?.oauth2) {
      setGoogleError('Dịch vụ Google Sign-In đang tải, vui lòng thử lại sau giây lát...')
      return
    }

    setIsGoogleLoading(true)

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setIsGoogleLoading(false)
            if (tokenResponse.error !== 'access_denied') {
              setGoogleError(`Lỗi đăng nhập Google: ${tokenResponse.error}`)
            }
            return
          }

          if (tokenResponse.access_token) {
            try {
              const authRes = await authApi.loginWithGoogle(tokenResponse.access_token)
              handleAuthSuccess(authRes)
            } catch (err: unknown) {
              const errObj = err as { message?: string }
              setGoogleError(errObj.message || 'Đăng nhập bằng Google không thành công.')
            } finally {
              setIsGoogleLoading(false)
            }
          } else {
            setIsGoogleLoading(false)
          }
        },
        error_callback: () => {
          setIsGoogleLoading(false)
          setGoogleError('Không thể mở cửa sổ đăng nhập Google.')
        },
      })

      tokenClient.requestAccessToken()
    } catch (err) {
      setIsGoogleLoading(false)
      setGoogleError('Có lỗi xảy ra khi kết nối Google.')
    }
  }, [handleAuthSuccess])

  return {
    isGoogleLoading,
    googleError,
    triggerGoogleLogin,
    setGoogleError,
  }
}
