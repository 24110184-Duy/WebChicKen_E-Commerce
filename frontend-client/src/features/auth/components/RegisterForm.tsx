import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../../../app/store/authStore'
import { PATHS } from '../../../app/router/paths'
import { analyzePhoneNumber } from '../../../shared/utils/phoneValidator'
import { useGoogleAuth } from '../hooks/useGoogleAuth'

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { isGoogleLoading, googleError, triggerGoogleLogin } = useGoogleAuth()

  const [phone, setPhone] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    phone?: string
    password?: string
    confirmPassword?: string
    agreeTerms?: string
  }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  // Phân tích số điện thoại theo thời gian thực
  const phoneAnalysis = analyzePhoneNumber(phone)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }))

    // Phân tích xem chuỗi người dùng vừa nhập có đạt chuẩn hợp lệ không
    const analysis = analyzePhoneNumber(val)
    if (analysis.isValid) {
      // Khi đã nhận diện đủ số và đúng quốc gia, tự động format: (+84) 332 790 798
      setPhone(analysis.formatted)
    } else {
      setPhone(val)
    }
  }

  const handlePhoneBlur = () => {
    const analysis = analyzePhoneNumber(phone)
    if (analysis.isValid) {
      setPhone(analysis.formatted)
    }
  }

  const validate = (): boolean => {
    const errors: {
      phone?: string
      password?: string
      confirmPassword?: string
      agreeTerms?: string
    } = {}

    if (!phone.trim()) {
      errors.phone = 'Please enter your phone number'
    } else if (!phoneAnalysis.isValid) {
      errors.phone = 'Số điện thoại không hợp lệ hoặc không xác định được mã quốc gia (+84...)'
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu'
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'Bạn cần đồng ý với Điều khoản dịch vụ'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setIsLoading(true)
    try {
      // Gửi số đã được chuẩn hóa về server
      const normalizedPhone = phoneAnalysis.normalized
      const response = await authApi.register({
        phone: normalizedPhone,
        identifier: normalizedPhone,
        password,
      })

      login(
        {
          id: response.user.userId,
          email: response.user.email || '',
          fullName: response.user.fullName,
          avatarUrl: response.user.logoUrl,
          roles: response.user.roles,
          phone: response.user.phone || normalizedPhone,
          username: response.user.username || '',
        },
        response.accessToken
      )

      navigate(PATHS.HOME, { replace: true })
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setServerError(errorObj.message || 'Đăng ký thất bại. Số điện thoại này có thể đã được sử dụng.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-card" style={{ maxWidth: '440px' }}>
      {/* Tab Switcher */}
      <div className="auth-tabs">
        <Link to={PATHS.LOGIN} className="auth-tab-btn">
          Sign In
        </Link>
        <button type="button" className="auth-tab-btn active">
          Sign Up
        </button>
      </div>

      {(serverError || googleError) && (
        <div className="auth-alert-box" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{serverError || googleError}</div>
        </div>
      )}


      <form onSubmit={handleSubmit} noValidate>
        {/* Phone Number Field */}
        <div className="form-group-modern">
          <label htmlFor="reg-phone" className="form-label-modern">
            <span>Phone Number</span>
            {phoneAnalysis.carrier && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#16a34a',
                  fontWeight: 600,
                  background: '#f0fdf4',
                  padding: '1px 8px',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0',
                }}
              >
                {phoneAnalysis.carrier}
              </span>
            )}
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              placeholder="Phone Number"
              className={`input-modern ${fieldErrors.phone ? 'input-error' : ''}`}
              style={{
                paddingRight: phoneAnalysis.isValid ? '44px' : '14px',
                paddingLeft: '14px',
                fontSize: '15px',
                fontWeight: 500,
                letterSpacing: phoneAnalysis.isValid ? '0.3px' : 'normal',
              }}
              disabled={isLoading}
              autoFocus
            />

            {/* Dấu tích xanh tròn hiển thị ở góc phải khi số hợp lệ (như ảnh) */}
            {phoneAnalysis.isValid && (
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
                title={`Đã xác thực: ${phoneAnalysis.countryName} (${phoneAnalysis.countryCode})`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
            )}
          </div>
          {fieldErrors.phone && <div className="form-field-error">! {fieldErrors.phone}</div>}
        </div>

        {/* Password */}
        <div className="form-group-modern">
          <label htmlFor="reg-password" className="form-label-modern">Password</label>
          <div className="input-icon-wrapper">
            <span className="input-left-icon"><Lock size={18} /></span>
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder="Tối thiểu 6 ký tự"
              className={`input-modern ${fieldErrors.password ? 'input-error' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              className="input-right-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && <div className="form-field-error">! {fieldErrors.password}</div>}
        </div>

        {/* Confirm Password */}
        <div className="form-group-modern">
          <label htmlFor="reg-confirm" className="form-label-modern">Confirm Password</label>
          <div className="input-icon-wrapper">
            <span className="input-left-icon"><Lock size={18} /></span>
            <input
              id="reg-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
              }}
              placeholder="Nhập lại mật khẩu"
              className={`input-modern ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              className="input-right-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <div className="form-field-error">! {fieldErrors.confirmPassword}</div>}
        </div>

        {/* Agree terms */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '14px 0 6px' }}>
          <input
            id="agree-terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#eab308', cursor: 'pointer' }}
          />
          <label htmlFor="agree-terms" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', lineHeight: 1.5 }}>
            Tôi đồng ý với <a href="#terms" className="auth-switch-link">Điều khoản dịch vụ</a> và{' '}
            <a href="#privacy" className="auth-switch-link">Chính sách bảo mật</a> của ChickyMart
          </label>
        </div>
        {fieldErrors.agreeTerms && <div className="form-field-error">! {fieldErrors.agreeTerms}</div>}

        {/* Submit Button */}
        <button type="submit" className="btn-primary-gradient" disabled={isLoading}>
          {isLoading ? 'Đang tạo tài khoản...' : 'SIGN UP'}
        </button>
      </form>

      {/* Social Divider */}
      <div className="social-divider">
        <span>Or continue with</span>
      </div>

      {/* Social Buttons */}
      <div className="social-grid">
        <button
          type="button"
          className="btn-social"
          onClick={triggerGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          style={{ opacity: isGoogleLoading ? 0.7 : 1 }}
        >
          {isGoogleLoading ? (
            <span
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(66, 133, 244, 0.3)',
                borderTopColor: '#4285F4',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          {isGoogleLoading ? 'Connecting...' : 'Google'}
        </button>
      </div>

      {/* Switch to Sign In */}
      <div className="auth-card-footer">
        Đã có tài khoản?{' '}
        <Link to={PATHS.LOGIN} className="auth-switch-link">
          Sign In
        </Link>
      </div>
    </div>
  )
}
export default RegisterForm

