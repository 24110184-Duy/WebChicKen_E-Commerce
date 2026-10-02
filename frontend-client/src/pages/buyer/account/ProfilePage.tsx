import React, { useState } from 'react'
import { Save, Mail, Phone, User } from 'lucide-react'
import { AccountLayout } from '../../../layouts/AccountLayout'
import { useAuthStore } from '../../../app/store/authStore'
import { customerApi, type UpdateProfileRequest } from '../../../features/auth/api/customerApi'

interface ProfileForm {
  fullName: string
  email: string
  phone: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  dateOfBirth: string
}

interface Toast { message: string; type: 'success' | 'error' }

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore()

  const [form, setForm] = useState<ProfileForm>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '0912345678',
    gender: 'MALE',
    dateOfBirth: '2000-01-01',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Please enter your full name'
    else if (form.fullName.trim().length < 2) newErrors.fullName = 'Name must be at least 2 characters'
    if (form.phone && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number (10 digits, starts with 0 or +84)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)

    // Payload khớp chuẩn BE UpdateProfileRequest
    const payload: UpdateProfileRequest = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
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

  const initials = form.fullName
    ? form.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <AccountLayout>
      <div className="account-card">
        <div className="account-card-header">
          <div>
            <h1 className="account-card-title">My Profile</h1>
            <p className="account-card-subtitle">Manage your personal information to keep your account secure</p>
          </div>
        </div>

        <div className="account-card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start' }}>
              {/* Form Fields */}
              <div>
                <div className="profile-form-grid">
                  {/* Full Name */}
                  <div className="profile-form-group">
                    <label className="profile-label">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} /> Full Name
                      </span>
                    </label>
                    <input
                      className={`profile-input ${errors.fullName ? 'error' : ''}`}
                      value={form.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <span className="profile-input-error">⚠ {errors.fullName}</span>}
                  </div>

                  {/* Phone */}
                  <div className="profile-form-group">
                    <label className="profile-label">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} /> Phone Number
                      </span>
                    </label>
                    <input
                      className={`profile-input ${errors.phone ? 'error' : ''}`}
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="0912 345 678"
                      type="tel"
                    />
                    {errors.phone && <span className="profile-input-error">⚠ {errors.phone}</span>}
                  </div>

                  {/* Email (readonly) */}
                  <div className="profile-form-group full-width">
                    <label className="profile-label">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={13} /> Email Address
                      </span>
                    </label>
                    <input
                      className="profile-input"
                      value={form.email}
                      disabled
                    />
                    <span className="profile-input-hint">Email address cannot be changed after registration</span>
                  </div>

                  {/* Gender — maps to BE: MALE | FEMALE | OTHER */}
                  <div className="profile-form-group">
                    <label className="profile-label">Gender</label>
                    <div className="profile-gender-group">
                      {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                        <label key={g} className="profile-gender-option">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={form.gender === g}
                            onChange={() => handleChange('gender', g)}
                          />
                          {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date of Birth — maps to BE: yyyy-MM-dd */}
                  <div className="profile-form-group">
                    <label className="profile-label">Date of Birth</label>
                    <input
                      className="profile-input"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={e => handleChange('dateOfBirth', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Save */}
                <div style={{ marginTop: 28 }}>
                  <button type="submit" className="btn-save-primary" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <span style={{
                          width: 14, height: 14,
                          border: '2px solid rgba(15,23,42,0.2)',
                          borderTopColor: '#0f172a',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                          display: 'inline-block'
                        }} />
                        Saving...
                      </>
                    ) : (
                      <><Save size={14} /> Save Changes</>
                    )}
                  </button>
                </div>
              </div>

              {/* Avatar */}
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrapper">{initials}</div>
                <button
                  type="button"
                  style={{
                    padding: '7px 18px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 8,
                    background: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                    color: '#475569',
                    fontWeight: 600,
                  }}
                  onClick={() => showToast('Photo upload available in TASK-25 (Media Module)', 'error')}
                >
                  Select Photo
                </button>
                <p className="profile-avatar-hint">
                  Max file size: 5 MB<br />
                  Formats: JPEG, PNG
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <div className={`account-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.message}
        </div>
      )}
    </AccountLayout>
  )
}
