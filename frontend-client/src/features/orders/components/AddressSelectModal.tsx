import React, { useState } from 'react'
import { MapPin, Plus, X, ArrowLeft } from 'lucide-react'
import type { AddressResponse, CreateAddressRequest } from '../../auth/api/customerApi'
import { customerApi } from '../../auth/api/customerApi'

export interface AddressSelectModalProps {
  isOpen: boolean
  onClose: () => void
  addresses: AddressResponse[]
  selectedAddressId?: string
  onSelectAddress: (address: AddressResponse) => void
  onAddressCreated: (newAddress: AddressResponse) => void
}

const VN_CITIES = [
  'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong',
  'Bien Hoa', 'Nha Trang', 'Hue', 'Vung Tau', 'Quy Nhon',
]

export const AddressSelectModal: React.FC<AddressSelectModalProps> = ({
  isOpen,
  onClose,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddressCreated,
}) => {
  const [tempSelectedId, setTempSelectedId] = useState<string | undefined>(selectedAddressId)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form state for adding new address
  const [newRecipientName, setNewRecipientName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddressLine1, setNewAddressLine1] = useState('')
  const [newDistrict, setNewDistrict] = useState('')
  const [newCity, setNewCity] = useState(VN_CITIES[0])
  const [newIsDefault, setNewIsDefault] = useState(false)

  // Sync tempSelectedId when modal opens or selectedAddressId changes
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedId(selectedAddressId)
      setIsAddingNew(false)
      setFormError(null)
    }
  }, [isOpen, selectedAddressId])

  if (!isOpen) return null

  const handleConfirm = () => {
    const found = addresses.find((a) => a.addressId === tempSelectedId)
    if (found) {
      onSelectAddress(found)
    }
    onClose()
  }

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!newRecipientName.trim()) {
      setFormError('Vui lòng nhập họ và tên người nhận')
      return
    }
    if (!newPhone.trim() || !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(newPhone.replace(/\s/g, ''))) {
      setFormError('Vui lòng nhập số điện thoại hợp lệ (10 số)')
      return
    }
    if (!newAddressLine1.trim()) {
      setFormError('Vui lòng nhập địa chỉ cụ thể')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CreateAddressRequest = {
        recipientName: newRecipientName.trim(),
        phone: newPhone.trim(),
        addressLine1: newAddressLine1.trim(),
        district: newDistrict.trim() || 'Quận/Huyện',
        city: newCity,
        isDefault: newIsDefault,
      }

      const created = await customerApi.createAddress(payload)
      onAddressCreated(created)
      setTempSelectedId(created.addressId)
      onSelectAddress(created)
      setIsAddingNew(false)
      // Reset form
      setNewRecipientName('')
      setNewPhone('')
      setNewAddressLine1('')
      setNewDistrict('')
      onClose()
    } catch (err: any) {
      setFormError(err?.message || 'Không thể tạo địa chỉ mới. Vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="address-modal-overlay" onClick={onClose}>
      <div className="address-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="address-modal-header">
          <div className="address-modal-title-wrapper">
            {isAddingNew ? (
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="address-modal-back-btn"
                title="Quay lại danh sách"
              >
                <ArrowLeft style={{ width: 20, height: 20 }} />
              </button>
            ) : (
              <div className="address-modal-icon-badge">
                <MapPin style={{ width: 18, height: 18 }} />
              </div>
            )}
            <h3 className="address-modal-title">
              {isAddingNew ? 'Thêm Địa Chỉ Mới' : 'Địa Chỉ Nhận Hàng Của Bạn'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="address-modal-close-btn"
            title="Đóng"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Body */}
        <div className="address-modal-body">
          {isAddingNew ? (
            /* Add New Address Form */
            <form onSubmit={handleSaveNewAddress}>
              {formError && (
                <div className="address-form-error">
                  {formError}
                </div>
              )}

              <div className="address-form-grid">
                <div className="address-form-field">
                  <label className="address-form-label">
                    Họ và Tên người nhận <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="address-form-input"
                  />
                </div>
                <div className="address-form-field">
                  <label className="address-form-label">
                    Số Điện Thoại <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0901234567"
                    className="address-form-input"
                  />
                </div>
              </div>

              <div className="address-form-field full-width">
                <label className="address-form-label">
                  Địa Chỉ Cụ Thể (Số nhà, Tên đường, Tòa nhà) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAddressLine1}
                  onChange={(e) => setNewAddressLine1(e.target.value)}
                  placeholder="Số 123 Đường Nguyễn Huệ, Phường Bến Nghé"
                  className="address-form-input"
                />
              </div>

              <div className="address-form-grid">
                <div className="address-form-field">
                  <label className="address-form-label">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    placeholder="Quận 1 / Thành phố Thủ Đức"
                    className="address-form-input"
                  />
                </div>
                <div className="address-form-field">
                  <label className="address-form-label">
                    Tỉnh / Thành Phố <span className="required">*</span>
                  </label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="address-form-select"
                  >
                    {VN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="address-form-checkbox-row">
                <input
                  type="checkbox"
                  id="newIsDefault"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="address-form-checkbox"
                />
                <span className="address-form-label" style={{ cursor: 'pointer' }}>
                  Đặt làm địa chỉ nhận hàng mặc định
                </span>
              </label>

              <div className="address-modal-footer" style={{ borderTop: '1px solid #f1f5f9', marginTop: 16, padding: '16px 0 0 0', backgroundColor: 'transparent' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="address-btn-cancel"
                >
                  Trở lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="address-btn-confirm"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu & Sử Dụng'}
                </button>
              </div>
            </form>
          ) : (
            /* Address List */
            <div className="address-list-container">
              {addresses.length === 0 ? (
                <div className="address-modal-empty">
                  <MapPin className="address-modal-empty-icon" />
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>Bạn chưa thiết lập địa chỉ nhận hàng nào trong tài khoản.</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Hãy thêm địa chỉ mới để tiếp tục đặt hàng.</p>
                </div>
              ) : (
                addresses.map((addr) => {
                  const isSelected = tempSelectedId === addr.addressId
                  return (
                    <div
                      key={addr.addressId}
                      onClick={() => setTempSelectedId(addr.addressId)}
                      className={`address-item-card ${isSelected ? 'is-selected' : ''}`}
                    >
                      {/* Radio circle */}
                      <div className="address-radio-circle">
                        {isSelected && <div className="address-radio-dot" />}
                      </div>

                      {/* Content */}
                      <div className="address-item-content">
                        <div className="address-item-header">
                          <span className="address-recipient-name">{addr.recipientName}</span>
                          <span className="address-divider">|</span>
                          <span className="address-phone">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="address-badge-default">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="address-item-detail">
                          {addr.addressLine1}
                          {addr.district ? `, ${addr.district}` : ''}
                          {addr.city ? `, ${addr.city}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Add New Address Button */}
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="address-btn-add"
              >
                <Plus style={{ width: 18, height: 18 }} />
                <span>Thêm Địa Chỉ Mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer (only show in list mode) */}
        {!isAddingNew && (
          <div className="address-modal-footer">
            <a
              href="/account/addresses"
              target="_blank"
              rel="noopener noreferrer"
              className="address-manage-link"
            >
              Thiết lập sổ địa chỉ trong tài khoản ↗
            </a>
            <div className="address-footer-actions">
              <button
                type="button"
                onClick={onClose}
                className="address-btn-cancel"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!tempSelectedId || addresses.length === 0}
                className="address-btn-confirm"
              >
                Xác Nhận Chọn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
