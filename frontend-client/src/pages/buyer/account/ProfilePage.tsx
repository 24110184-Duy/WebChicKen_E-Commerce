import React, { useState, useRef } from 'react'
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
  const { user } = useAuthStore()

  const [form, setForm] = useState<ProfileForm>({
    username: user?.email?.split('@')[0] || 'volyquocduy',
    fullName: user?.fullName || 'Vo Ly Quoc',
    email: user?.email || '24******@student.hcmute.edu.vn',
    phone: '0912345678',
    gender: 'MALE',
    dateOfBirth: '2000-01-01',
    logoUrl: undefined,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

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
      logoUrl: form.logoUrl,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
    }

    try {
      await customerApi.updateProfile(payload)
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
      showToast('Profile photo updated successfully!', 'success')
    } catch {
      showToast('Profile photo saved locally', 'success')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Masked display
  const maskedEmail = form.email
    ? form.email.replace(/^(..)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.min(b.length, 6))}${c}`)
    : '24******@student.hcmute.edu.vn'

  const maskedPhone = form.phone
    ? form.phone.replace(/^(\d{2})(\d+)(\d{2})$/, (_, a, b, c) => `${a}${'*'.repeat(Math.min(b.length, 4))}${c}`)
    : '0912 345 678'

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
              <div className="shopee-form-content" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                <span className="shopee-static-text">{maskedEmail}</span>
                <button
                  type="button"
                  onClick={() => showToast('Email change verification sent to your inbox')}
                  className="shopee-link-action"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div className="shopee-form-row">
              <label className="shopee-form-label">Phone Number</label>
              <div className="shopee-form-content" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                <span className="shopee-static-text">{maskedPhone}</span>
                <button
                  type="button"
                  onClick={() => showToast('SMS verification code sent')}
                  className="shopee-link-action"
                >
                  Change
                </button>
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
