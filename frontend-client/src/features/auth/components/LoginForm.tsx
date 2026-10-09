import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../../../app/store/authStore'
import { PATHS } from '../../../app/router/paths'
import { useGoogleAuth } from '../hooks/useGoogleAuth'

export const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const { isGoogleLoading, googleError, triggerGoogleLogin } = useGoogleAuth()

  const [identifier, setIdentifier] = useState('')

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {}

    if (!identifier.trim()) {
      errors.identifier = 'Please enter your phone number, username or email'
    }

    if (!password) {
      errors.password = 'Please enter your password'
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
      const response = await authApi.login({
        identifier: identifier.trim(),
        email: identifier.trim(),
        password,
      })

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
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setServerError(errorObj.message || 'Incorrect account or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-card">
      {/* Tab Switcher */}
      <div className="auth-tabs">
        <button type="button" className="auth-tab-btn active">
          Sign In
        </button>
        <Link to={PATHS.REGISTER} className="auth-tab-btn">
          Sign Up
        </Link>
      </div>

      {/* Error Alert Box */}
      {(serverError || googleError) && (
        <div className="auth-alert-box" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{serverError || googleError}</div>
        </div>
      )}


      <form onSubmit={handleSubmit} noValidate>
        {/* Identifier Field: Phone number / Username / Email */}
        <div className="form-group-modern">
          <label htmlFor="login-identifier" className="form-label-modern">
            <span>Phone number / Username / Email</span>
          </label>
          <div className="input-icon-wrapper">
            <span className="input-left-icon">
              <Phone size={18} />
            </span>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                if (fieldErrors.identifier) setFieldErrors((prev) => ({ ...prev, identifier: undefined }))
              }}
              placeholder="Phone number / Username / Email"
              className={`input-modern ${fieldErrors.identifier ? 'input-error' : ''}`}
              disabled={isLoading}
              autoFocus
            />
          </div>
          {fieldErrors.identifier && <div className="form-field-error">! {fieldErrors.identifier}</div>}
        </div>

        {/* Password Field */}
        <div className="form-group-modern">
          <div className="form-label-modern">
            <label htmlFor="login-password">Password</label>
            <Link to={PATHS.FORGOT_PASSWORD} className="auth-switch-link" style={{ fontSize: '12px', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <div className="input-icon-wrapper">
            <span className="input-left-icon">
              <Lock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder="Enter your password"
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

        {/* Remember Me */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 6px' }}>
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#eab308', cursor: 'pointer' }}
          />
          <label htmlFor="remember-me" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
            Remember me on this device
          </label>
        </div>

        {/* Primary Submit Button */}
        <button type="submit" className="btn-primary-gradient" disabled={isLoading}>
          {isLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
              Signing in...
            </span>
          ) : (
            'SIGN IN'
          )}
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

        <button
          type="button"
          className="btn-social"
          onClick={() =>
            alert(
              'Tính năng đăng nhập Facebook đang được tích hợp! Quý khách vui lòng chọn đăng nhập Google hoặc nhập Số điện thoại.'
            )
          }
          disabled={isLoading || isGoogleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>


      {/* Switch to Register */}
      <div className="auth-switch-text">
        New to ChickyMart?
        <Link to={PATHS.REGISTER} className="auth-switch-link">
          Sign Up Now
        </Link>
      </div>
    </div>
  )
}
export default LoginForm
