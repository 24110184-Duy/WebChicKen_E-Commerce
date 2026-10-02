import React, { useState } from 'react'
import { Plus, X, MapPin } from 'lucide-react'
import { AccountLayout } from '../../../layouts/AccountLayout'
import { customerApi } from '../../../features/auth/api/customerApi'

// Khớp với BE AddressResponse (dùng addressId)
interface Address {
  id: string        // maps to BE: addressId
  recipientName: string
  phone: string
  addressLine1: string
  district: string
  city: string
  isDefault: boolean
}

// Khớp với BE CreateAddressRequest (bắt buộc có isDefault)
interface AddressFormData {
  recipientName: string
  phone: string
  addressLine1: string
  district: string
  city: string
}

const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    recipientName: 'John Doe',
    phone: '0912 345 678',
    addressLine1: '123 Nguyen Van Linh St, Tan Phong Ward',
    district: 'District 7',
    city: 'Ho Chi Minh City',
    isDefault: true,
  },
  {
    id: 'addr-2',
    recipientName: 'John Doe',
    phone: '0912 345 678',
    addressLine1: '45 Le Van Viet St, Hiep Phu Ward',
    district: 'Thu Duc City',
    city: 'Ho Chi Minh City',
    isDefault: false,
  },
]

const VN_CITIES = [
  'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong',
  'Bien Hoa', 'Nha Trang', 'Hue', 'Vung Tau', 'Quy Nhon',
]

const EMPTY_FORM: AddressFormData = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  district: '',
  city: '',
}

interface Toast { message: string; type: 'success' | 'error' }

export const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<AddressFormData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (addr: Address) => {
    setEditingId(addr.id)
    setForm({
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      district: addr.district,
      city: addr.city,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const validateForm = (): boolean => {
    const errs: Partial<AddressFormData> = {}
    if (!form.recipientName.trim()) errs.recipientName = 'Please enter the recipient name'
    if (!form.phone.trim()) errs.phone = 'Please enter a phone number'
    else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Invalid phone number format'
    if (!form.addressLine1.trim()) errs.addressLine1 = 'Please enter the street address'
    if (!form.district.trim()) errs.district = 'Please enter the district'
    if (!form.city) errs.city = 'Please select a city'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setIsSaving(true)

    try {
      if (editingId) {
        // PUT /api/v1/customers/addresses/{id}/default nếu đổi default
        // Hiện BE chỉ hỗ trợ set-default riêng; update address sẽ thêm ở TASK sau
        setAddresses(prev => prev.map(a =>
          a.id === editingId ? { ...a, ...form } : a
        ))
        showToast('Address updated successfully!', 'success')
      } else {
        // POST /api/v1/customers/addresses — payload khớp BE CreateAddressRequest
        const payload = {
          ...form,
          isDefault: addresses.length === 0, // Tự động đặt mặc định nếu là địa chỉ đầu tiên
        }
        const created = await customerApi.createAddress(payload)
        const newAddr: Address = {
          id: created.addressId,
          recipientName: created.recipientName,
          phone: created.phone,
          addressLine1: created.addressLine1,
          district: created.district,
          city: created.city,
          isDefault: created.isDefault,
        }
        setAddresses(prev => [...prev, newAddr])
        showToast('New address added successfully!', 'success')
      }
    } catch {
      showToast('Failed to save address. Please try again.', 'error')
    } finally {
      setIsSaving(false)
      closeModal()
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return
    try {
      // DELETE /api/v1/customers/addresses/{addressId}
      await customerApi.deleteAddress(id)
      setAddresses(prev => {
        const filtered = prev.filter(a => a.id !== id)
        if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
          filtered[0].isDefault = true
        }
        return filtered
      })
      showToast('Address deleted!', 'success')
    } catch {
      showToast('Failed to delete address.', 'error')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // PUT /api/v1/customers/addresses/{addressId}/default
      await customerApi.setDefaultAddress(id)
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
      showToast('Default address updated!', 'success')
    } catch {
      showToast('Failed to set default address.', 'error')
    }
  }

  const handleFormChange = (field: keyof AddressFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <AccountLayout>
      <div className="account-card">
        <div className="account-card-header">
          <div>
            <h1 className="account-card-title">My Address Book</h1>
            <p className="account-card-subtitle">Manage your delivery addresses</p>
          </div>
        </div>

        <div className="account-card-body">
          {addresses.length === 0 ? (
            <div className="address-empty">
              <div className="address-empty-icon">📦</div>
              <p className="account-card-title" style={{ fontSize: 16, marginBottom: 8 }}>No addresses yet</p>
              <p className="address-empty-text">Add an address to make checkout faster!</p>
              <button className="btn-save-primary" style={{ marginTop: 20 }} onClick={openAddModal}>
                <Plus size={15} /> Add Your First Address
              </button>
            </div>
          ) : (
            <div className="address-list">
              {addresses.map(addr => (
                <div key={addr.id} className={`address-card ${addr.isDefault ? 'is-default' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <MapPin size={16} color={addr.isDefault ? '#b45309' : '#94a3b8'} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div className="address-info">
                      <div className="address-recipient">
                        <span className="address-name">{addr.recipientName}</span>
                        <div className="address-divider" />
                        <span className="address-phone">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="address-badge-default">Default</span>
                        )}
                      </div>
                      <p className="address-text">
                        {addr.addressLine1}, {addr.district}, {addr.city}
                      </p>
                    </div>
                  </div>

                  <div className="address-actions">
                    <button className="btn-address-action edit" onClick={() => openEditModal(addr)}>
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <>
                        <span className="address-action-sep">|</span>
                        <button className="btn-address-action delete" onClick={() => handleDelete(addr.id)}>
                          Delete
                        </button>
                        <span className="address-action-sep">|</span>
                        <button className="btn-address-action set-default" onClick={() => handleSetDefault(addr.id)}>
                          Set as Default
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {addresses.length < 5 && (
                <button className="btn-add-address" onClick={openAddModal}>
                  <Plus size={16} /> Add New Address
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal — Add / Edit Address */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Name & Phone */}
              <div className="modal-form-row">
                <div className="profile-form-group">
                  <label className="profile-label">Recipient Name</label>
                  <input
                    className={`profile-input ${formErrors.recipientName ? 'error' : ''}`}
                    value={form.recipientName}
                    onChange={e => handleFormChange('recipientName', e.target.value)}
                    placeholder="Full name"
                  />
                  {formErrors.recipientName && <span className="profile-input-error">⚠ {formErrors.recipientName}</span>}
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">Phone Number</label>
                  <input
                    className={`profile-input ${formErrors.phone ? 'error' : ''}`}
                    value={form.phone}
                    onChange={e => handleFormChange('phone', e.target.value)}
                    placeholder="0912 345 678"
                    type="tel"
                  />
                  {formErrors.phone && <span className="profile-input-error">⚠ {formErrors.phone}</span>}
                </div>
              </div>

              {/* City / District */}
              <div className="modal-form-row">
                <div className="profile-form-group">
                  <label className="profile-label">City / Province</label>
                  <select
                    className={`profile-input ${formErrors.city ? 'error' : ''}`}
                    value={form.city}
                    onChange={e => handleFormChange('city', e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Select City --</option>
                    {VN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.city && <span className="profile-input-error">⚠ {formErrors.city}</span>}
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">District</label>
                  <input
                    className={`profile-input ${formErrors.district ? 'error' : ''}`}
                    value={form.district}
                    onChange={e => handleFormChange('district', e.target.value)}
                    placeholder="e.g. District 7"
                  />
                  {formErrors.district && <span className="profile-input-error">⚠ {formErrors.district}</span>}
                </div>
              </div>

              {/* Street Address */}
              <div className="profile-form-group">
                <label className="profile-label">Street Address</label>
                <input
                  className={`profile-input ${formErrors.addressLine1 ? 'error' : ''}`}
                  value={form.addressLine1}
                  onChange={e => handleFormChange('addressLine1', e.target.value)}
                  placeholder="House number, street name, ward..."
                />
                {formErrors.addressLine1 && <span className="profile-input-error">⚠ {formErrors.addressLine1}</span>}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-modal-submit" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : (editingId ? 'Update Address' : 'Add Address')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`account-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.message}
        </div>
      )}
    </AccountLayout>
  )
}
