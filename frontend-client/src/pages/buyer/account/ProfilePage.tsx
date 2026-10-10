import React, { useState, useRef, useEffect } from 'react'
import { AccountLayout } from '../../../layouts/AccountLayout'
import { useAuthStore } from '../../../app/store/authStore'
import { customerApi, type UpdateProfileRequest } from '../../../features/auth/api/customerApi'
import { httpClient } from '../../../shared/api/httpClient'
import { SellerRegisterModal } from '../../../features/seller/components/SellerRegisterModal'

interface ProfileForm {
  username: string
  fullName: string
  email: string
  phone: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  dateOfBirth: string
  logoUrl?: string
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore()

  const [form, setForm] = useState<ProfileForm>({
    username: user?.username || user?.email?.split('@')[0] || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: (user?.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
    dateOfBirth: user?.dateOfBirth || '2000-01-01',
    logoUrl: user?.avatarUrl || undefined,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false)

  // Phone modal state
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneModalError, setPhoneModalError] = useState('')
  const [isSavingPhone, setIsSavingPhone] = useState(false)

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailModalError, setEmailModalError] = useState('')
  const [isSavingEmail, setIsSavingEmail] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Tải dữ liệu hồ sơ thực tế từ backend khi mount
  useEffect(() => {
    let isMounted = true
    customerApi.getProfile()
      .then((profile) => {
        if (!isMounted) return
        setForm((prev) => ({
          ...prev,
          username: profile.email ? profile.email.split('@')[0] : (prev.username || ''),
          fullName: profile.fullName || prev.fullName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          gender: (profile.gender as 'MALE' | 'FEMALE' | 'OTHER') || prev.gender,
          dateOfBirth: profile.dateOfBirth || prev.dateOfBirth,
          logoUrl: profile.logoUrl || prev.logoUrl,
        }))
        // Đồng bộ dữ liệu mới nhất vào authStore
        updateUser({
          fullName: profile.fullName,
          avatarUrl: profile.logoUrl,
          email: profile.email,
          phone: profile.phone,
        })
      })
      .catch((err) => {
        console.warn('Could not load profile from server:', err)
      })

    return () => {
      isMounted = false
    }
  }, [updateUser])

  // Parse DOB
  const dobParts = (form.dateOfBirth || '2000-01-01').split('-')
  const currentYear = dobParts[0] || '2000'
  const currentMonth = String(parseInt(dobParts[1] || '1', 10))
  const currentDay = String(parseInt(dobParts[2] || '1', 10))

  const handleDobChange = (part: 'day' | 'month' | 'year', val: string) => {
    const y = part === 'year' ? val : currentYear
    const m = (part === 'month' ? val : currentMonth).padStart(2, '0')
    const d = (part === 'day' ? val : currentDay).padStart(2, '0')
    setForm(prev => ({ ...prev, dateOfBirth: `${y}-${m}-${d}` }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Please enter your name'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)

    const payload: UpdateProfileRequest = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      logoUrl: form.logoUrl,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
    }

    try {
      const updated = await customerApi.updateProfile(payload)
      // Cập nhật authStore ngay lập tức để header và các trang khác lập tức đổi tên
      updateUser({
        fullName: updated.fullName || payload.fullName,
        avatarUrl: updated.logoUrl || payload.logoUrl,
        phone: updated.phone || payload.phone,
        email: updated.email || payload.email,
      })
      showToast('Profile updated successfully!', 'success')
    } catch {
      showToast('Failed to update profile. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPEG and PNG file extensions are supported', 'error')
      return
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds maximum 5 MB limit', 'error')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setForm(prev => ({ ...prev, logoUrl: previewUrl }))
    setIsUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await httpClient.post<{ fileUrl: string }>('/media/upload', formData)
      const remoteUrl = res.data?.fileUrl || previewUrl
      setForm(prev => ({ ...prev, logoUrl: remoteUrl }))
      updateUser({ avatarUrl: remoteUrl })
      showToast('Profile photo updated successfully!', 'success')
    } catch {
      showToast('Profile photo saved locally', 'success')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Xử lý lưu số điện thoại từ modal
  const handleSavePhoneModal = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = phoneInput.trim().replace(/\s+/g, '')
    if (!trimmed) {
      setPhoneModalError('Vui lòng nhập số điện thoại.')
      return
    }

    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
    if (!phoneRegex.test(trimmed)) {
      setPhoneModalError('Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).')
      return
    }

    setIsSavingPhone(true)
    setPhoneModalError('')

    try {
      await customerApi.updateProfile({
        fullName: form.fullName,
        phone: trimmed,
        logoUrl: form.logoUrl,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
      })
      setForm(prev => ({ ...prev, phone: trimmed }))
      updateUser({ phone: trimmed })
      showToast('Đã cập nhật số điện thoại thành công!', 'success')
      setIsPhoneModalOpen(false)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setPhoneModalError(errObj?.message || 'Không thể lưu số điện thoại. Vui lòng thử lại.')
    } finally {
      setIsSavingPhone(false)
    }
  }

  // Xử lý lưu email từ modal
  const handleSaveEmailModal = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = emailInput.trim().toLowerCase()
    if (!trimmed) {
      setEmailModalError('Vui lòng nhập địa chỉ email.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setEmailModalError('Địa chỉ email không đúng định dạng.')
      return
    }

    setIsSavingEmail(true)
    setEmailModalError('')

    try {
      await customerApi.updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        email: trimmed,
        logoUrl: form.logoUrl,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
      })
      setForm(prev => ({ ...prev, email: trimmed }))
      updateUser({ email: trimmed })
      showToast('Đã cập nhật email thành công!', 'success')
      setIsEmailModalOpen(false)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setEmailModalError(errObj?.message || 'Không thể lưu email. Vui lòng thử lại.')
    } finally {
      setIsSavingEmail(false)
    }
  }

  // Masked display — chỉ mask khi có dữ liệu, không gán mặc định chuỗi giả
  const maskedEmail = form.email && form.email.trim()
    ? form.email.replace(/^(..)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(1, Math.min(b.length, 6)))}${c}`)
    : ''

  const maskedPhone = form.phone && form.phone.trim()
    ? form.phone.replace(/^(\d{2})(\d+)(\d{2})$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(1, Math.min(b.length, 4)))}${c}`)
    : ''

  return (
    <AccountLayout>
      <div className="shopee-card">
        {/* Card Header */}
        <div className="shopee-card-header">
          <div>
            <h1 className="shopee-card-title">My Profile</h1>
            <p className="shopee-card-subtitle">Manage and protect your account</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSellerModalOpen(true)}
            style={{
              padding: '7px 16px',
              borderRadius: 2,
              background: '#fefce8',
              color: '#92400e',
              border: '1px solid #fde68a',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Register as Seller
          </button>
        </div>

        {/* Card Body: Form + Avatar */}
        <div className="shopee-profile-body">
          {/* Left: Form */}
          <form onSubmit={handleSubmit} style={{ minWidth: 0 }}>
            {/* Username */}
            <div className="shopee-form-row">
              <label className="shopee-form-label">Username</label>
              <div className="shopee-form-content">
                <input
                  type="text"
                  className="shopee-input"
                  value={form.username}
                  onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                />
                <span className="shopee-form-hint">Username can only be changed once.</span>
              </div>
            </div>

            {/* Name */}
            <div className="shopee-form-row">
              <label className="shopee-form-label">Name</label>
              <div className="shopee-form-content">
                <input
                  type="text"
                  className={`shopee-input ${errors.fullName ? 'error' : ''}`}
                  value={form.fullName}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, fullName: e.target.value }))
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }))
                  }}
                  placeholder="Enter your name"
                />
                {errors.fullName && <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.fullName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="shopee-form-row">
              <label className="shopee-form-label">Email</label>
              <div className="shopee-form-content" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}>
                {maskedEmail ? (
                  <>
                    <span className="shopee-static-text">{maskedEmail}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput(form.email)
                        setEmailModalError('')
                        setIsEmailModalOpen(true)
                      }}
                      className="shopee-link-action"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <>
                    <span className="shopee-static-text" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Chưa cập nhật
                    </span>
                    <span style={{ fontSize: 11, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      Chưa có email
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('')
                        setEmailModalError('')
                        setIsEmailModalOpen(true)
                      }}
                      className="shopee-link-action"
                      style={{ fontWeight: 700, color: '#0284c7' }}
                    >
                      Add
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="shopee-form-row">
              <label className="shopee-form-label">Phone Number</label>
              <div className="shopee-form-content" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}>
                {maskedPhone ? (
                  <>
                    <span className="shopee-static-text">{maskedPhone}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(form.phone)
                        setPhoneModalError('')
                        setIsPhoneModalOpen(true)
                      }}
                      className="shopee-link-action"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <>
                    <span className="shopee-static-text" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Chưa cập nhật
                    </span>
                    <span style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      Yêu cầu cung cấp số điện thoại
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput('')
                        setPhoneModalError('')
                        setIsPhoneModalOpen(true)
                      }}
                      className="shopee-link-action"
                      style={{ fontWeight: 700, color: '#eab308' }}
                    >
                      Add
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="shopee-form-row">
              <label className="shopee-form-label">Gender</label>
              <div className="shopee-form-content">
                <div className="shopee-gender-group">
                  {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                    <label key={g} className="shopee-gender-option">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={form.gender === g}
                        onChange={() => setForm(prev => ({ ...prev, gender: g }))}
                      />
                      {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="shopee-form-row">
              <label className="shopee-form-label">Date of birth</label>
              <div className="shopee-form-content">
                <div className="shopee-dob-group">
                  {/* Date select */}
                  <select
                    className="shopee-select"
                    value={currentDay}
                    onChange={(e) => handleDobChange('day', e.target.value)}
                  >
                    <option value="" disabled>Date</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {/* Month select */}
                  <select
                    className="shopee-select"
                    value={currentMonth}
                    onChange={(e) => handleDobChange('month', e.target.value)}
                  >
                    <option value="" disabled>Month</option>
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={String(idx + 1)}>{name}</option>
                    ))}
                  </select>

                  {/* Year select */}
                  <select
                    className="shopee-select"
                    value={currentYear}
                    onChange={(e) => handleDobChange('year', e.target.value)}
                  >
                    <option value="" disabled>Year</option>
                    {Array.from({ length: 85 }, (_, i) => String(2026 - i)).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: 24 }}>
              <button
                type="submit"
                className="shopee-btn-save"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>

          {/* Right: Avatar Column */}
          <div className="shopee-avatar-section">
            <div className="shopee-avatar-circle">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Profile photo" />
              ) : (
                <div style={{ color: '#bbb', fontSize: 36, fontWeight: 700 }}>
                  {form.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <button
              type="button"
              className="shopee-btn-select-img"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingPhoto ? 'Uploading...' : 'Select Image'}
            </button>

            {form.logoUrl && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#0055aa', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  View Full Size
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, logoUrl: undefined }))}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  Remove
                </button>
              </div>
            )}

            <div className="shopee-avatar-hints">
              <div>File size: maximum 1 MB</div>
              <div>File extension: .JPEG, .PNG</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cập nhật Số điện thoại */}
      {isPhoneModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPhoneModalOpen(false)} style={{ zIndex: 1000 }}>
          <div
            className="modal-box"
            style={{ maxWidth: 440, width: '100%', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: 16 }}>
              <h3 className="modal-title" style={{ fontSize: 16, fontWeight: 700 }}>
                {form.phone ? 'Thay đổi số điện thoại' : 'Cung cấp số điện thoại'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="modal-close-text"
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Vui lòng nhập số điện thoại để bảo vệ tài khoản và nhận cập nhật đơn hàng.
            </p>
            <form onSubmit={handleSavePhoneModal}>
              <div style={{ marginBottom: 14 }}>
                <input
                  type="tel"
                  className="shopee-input"
                  style={{ width: '100%', fontSize: 14 }}
                  placeholder="Ví dụ: 0912345678"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value)
                    if (phoneModalError) setPhoneModalError('')
                  }}
                  autoFocus
                />
                {phoneModalError && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>
                    {phoneModalError}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingPhone}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 4,
                    border: 'none',
                    background: '#ee4d2d',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingPhone ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cập nhật Email */}
      {isEmailModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEmailModalOpen(false)} style={{ zIndex: 1000 }}>
          <div
            className="modal-box"
            style={{ maxWidth: 440, width: '100%', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: 16 }}>
              <h3 className="modal-title" style={{ fontSize: 16, fontWeight: 700 }}>
                {form.email ? 'Thay đổi email' : 'Cung cấp email'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="modal-close-text"
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Vui lòng nhập địa chỉ email chính xác để nhận biên lai thanh toán và thông báo bảo mật.
            </p>
            <form onSubmit={handleSaveEmailModal}>
              <div style={{ marginBottom: 14 }}>
                <input
                  type="email"
                  className="shopee-input"
                  style={{ width: '100%', fontSize: 14 }}
                  placeholder="Ví dụ: yourname@gmail.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value)
                    if (emailModalError) setEmailModalError('')
                  }}
                  autoFocus
                />
                {emailModalError && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>
                    {emailModalError}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEmail}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 4,
                    border: 'none',
                    background: '#ee4d2d',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingEmail ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Full size viewer */}
      {isLightboxOpen && form.logoUrl && (
        <div className="modal-overlay" onClick={() => setIsLightboxOpen(false)} style={{ zIndex: 1000 }}>
          <div
            className="modal-box"
            style={{ maxWidth: '90vw', width: 'auto', maxHeight: '90vh', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Profile Photo Details</h3>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="modal-close-text"
              >
                Close
              </button>
            </div>
            <div
              style={{
                padding: 20,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#0f172a',
                maxHeight: 'calc(90vh - 65px)',
                overflow: 'auto',
              }}
            >
              <img
                src={form.logoUrl}
                alt="Full size view"
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`account-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Seller Register Modal */}
      <SellerRegisterModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        onSuccess={() => {
          showToast('Seller application submitted successfully!', 'success')
        }}
      />
    </AccountLayout>
  )
}
export default ProfilePage
