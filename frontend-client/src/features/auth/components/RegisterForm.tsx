import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../../../app/store/authStore'
import { PATHS } from '../../../app/router/paths'

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    phone?: string
    password?: string
    confirmPassword?: string
    agreeTerms?: string
  }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const errors: {
      fullName?: string
      email?: string
      phone?: string
      password?: string
      confirmPassword?: string
      agreeTerms?: string
    } = {}

    if (!fullName.trim()) {
      errors.fullName = 'Please enter your full name'
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email address format'
    }

    if (!phone.trim()) {
      errors.phone = 'Please enter your phone number'
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phone.trim().replace(/\s+/g, ''))) {
      errors.phone = 'Invalid phone number (10 digits, starts with 0 or +84)'
    }

    if (!password) {
      errors.password = 'Please enter your password'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the Terms of Service'
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
      const response = await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      })

      login(
        {
          id: response.user.userId,
          email: response.user.email,
          fullName: response.user.fullName,
          avatarUrl: response.user.logoUrl,
          roles: response.user.roles,
        },
        response.accessToken
      )

      navigate(PATHS.HOME, { replace: true })
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setServerError(errorObj.message || 'Registration failed. This email may already be in use.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-card" style={{ maxWidth: '460px' }}>
      {/* Tab Switcher */}
      <div className="auth-tabs">
        <Link to={PATHS.LOGIN} className="auth-tab-btn">
          Sign In
        </Link>
        <button type="button" className="auth-tab-btn active">
          Sign Up
        </button>
      </div>

      {serverError && (
        <div className="auth-alert-box" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="form-group-modern">
          <label htmlFor="reg-name" className="form-label-modern">Full Name</label>
          <div className="input-icon-wrapper">
            <span className="input-left-icon"><User size={18} /></span>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }))
              }}
              placeholder="e.g. John Doe"
              className={`input-modern ${fieldErrors.fullName ? 'input-error' : ''}`}
              disabled={isLoading}
              autoFocus
            />
          </div>
          {fieldErrors.fullName && <div className="form-field-error">! {fieldErrors.fullName}</div>}
        </div>

        {/* Email & Phone side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group-modern">
            <label htmlFor="reg-email" className="form-label-modern">Email</label>
            <div className="input-icon-wrapper">
              <span className="input-left-icon"><Mail size={18} /></span>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="name@domain.com"
                className={`input-modern ${fieldErrors.email ? 'input-error' : ''}`}
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && <div className="form-field-error">! {fieldErrors.email}</div>}
          </div>

          <div className="form-group-modern">
            <label htmlFor="reg-phone" className="form-label-modern">Phone Number</label>
            <div className="input-icon-wrapper">
              <span className="input-left-icon"><Phone size={18} /></span>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                placeholder="0912345678"
                className={`input-modern ${fieldErrors.phone ? 'input-error' : ''}`}
                disabled={isLoading}
              />
            </div>
            {fieldErrors.phone && <div className="form-field-error">! {fieldErrors.phone}</div>}
          </div>
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
              placeholder="At least 8 characters"
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
              placeholder="Re-enter your password"
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
            style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#ee4d2d', cursor: 'pointer' }}
          />
          <label htmlFor="agree-terms" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', lineHeight: 1.5 }}>
            I agree to ChickyMart's <a href="#terms" className="auth-switch-link">Terms of Service</a> and{' '}
            <a href="#privacy" className="auth-switch-link">Privacy Policy</a>
          </label>
        </div>
        {fieldErrors.agreeTerms && <div className="form-field-error">! {fieldErrors.agreeTerms}</div>}

        {/* Submit Button */}
        <button type="submit" className="btn-primary-gradient" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'CREATE ACCOUNT'}
        </button>
      </form>

      {/* Social Divider */}
      <div className="social-divider">
        <span>Or sign up with</span>
      </div>

      <div className="social-grid">
        <button type="button" className="btn-social" onClick={() => alert('Sign up with Google')}>
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
          Google
        </button>

        <button type="button" className="btn-social" onClick={() => alert('Sign up with Facebook')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

      {/* Switch to Login */}
      <div className="auth-switch-text">
        Already have a ChickyMart account?
        <Link to={PATHS.LOGIN} className="auth-switch-link">
          Sign In
        </Link>
      </div>
    </div>
  )
}
export default RegisterForm
