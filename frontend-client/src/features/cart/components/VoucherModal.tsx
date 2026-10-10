import React, { useEffect, useState } from 'react'
import { Ticket, HelpCircle, X, AlertCircle } from 'lucide-react'
import { voucherApi } from '../api/voucherApi'
import type { BackendVoucher, ValidateVoucherResult } from '../api/voucherApi'
import { formatMoney } from '../../../shared/lib/formatMoney'

export interface VoucherModalProps {
  isOpen: boolean
  onClose: () => void
  orderValueMinor: number
  storeId?: string
  appliedVoucherCode?: string
  onSelectVoucher: (result: ValidateVoucherResult | null) => void
}

// Fallback platform vouchers if database has not been seeded yet
const DEFAULT_PLATFORM_VOUCHERS: BackendVoucher[] = [
  {
    id: 'vouch001-0000-4000-8000-000000000001',
    code: 'FREESHIP',
    title: 'Shipping Fee up to 30k Off',
    description: 'Miễn phí vận chuyển cho mọi đơn hàng',
    type: 'AMOUNT',
    discountValueMinor: 30000,
    minOrderValueMinor: 0,
    maxDiscountAmountMinor: 30000,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    usageLimit: 10000,
    usedCount: 0,
    isActive: true,
  },
  {
    id: 'vouch002-0000-4000-8000-000000000002',
    code: 'FREESHIP50',
    title: 'Shipping Fee up to 50k Off',
    description: 'Miễn phí ship cho đơn từ 200.000đ',
    type: 'AMOUNT',
    discountValueMinor: 50000,
    minOrderValueMinor: 200000,
    maxDiscountAmountMinor: 50000,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    usageLimit: 10000,
    usedCount: 0,
    isActive: true,
  },
  {
    id: 'vouch003-0000-4000-8000-000000000003',
    code: 'CHICKYNEW',
    title: 'Giảm 20.000đ Đơn Đầu Tiên',
    description: 'Voucher chào mừng thành viên mới',
    type: 'AMOUNT',
    discountValueMinor: 20000,
    minOrderValueMinor: 50000,
    maxDiscountAmountMinor: 20000,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    usageLimit: 10000,
    usedCount: 0,
    isActive: true,
  },
  {
    id: 'vouch004-0000-4000-8000-000000000004',
    code: 'CHICKY10',
    title: 'Giảm 10% Tối Đa 50k',
    description: 'Ưu đãi giảm giá 10% toàn sàn',
    type: 'PERCENTAGE',
    discountValueMinor: 10,
    minOrderValueMinor: 150000,
    maxDiscountAmountMinor: 50000,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    usageLimit: 10000,
    usedCount: 0,
    isActive: true,
  },
  {
    id: 'vouch005-0000-4000-8000-000000000005',
    code: 'CHICKYMEGA',
    title: 'Mega Voucher Giảm 50.000đ',
    description: 'Giảm 50k cho đơn hàng từ 500k',
    type: 'AMOUNT',
    discountValueMinor: 50000,
    minOrderValueMinor: 500000,
    maxDiscountAmountMinor: 50000,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    usageLimit: 10000,
    usedCount: 0,
    isActive: true,
  },
]

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  orderValueMinor,
  storeId,
  appliedVoucherCode,
  onSelectVoucher,
}) => {
  const [vouchers, setVouchers] = useState<BackendVoucher[]>([])
  const [loading, setLoading] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [selectedCode, setSelectedCode] = useState<string | null>(appliedVoucherCode || null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isApplyingCode, setIsApplyingCode] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedCode(appliedVoucherCode || null)
      setInputCode('')
      setStatusMessage(null)
      setLoading(true)

      voucherApi
        .getAvailableVouchers(storeId)
        .then((list) => {
          if (list && list.length > 0) {
            setVouchers(list)
          } else {
            setVouchers(DEFAULT_PLATFORM_VOUCHERS)
          }
        })
        .catch(() => {
          setVouchers(DEFAULT_PLATFORM_VOUCHERS)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, storeId, appliedVoucherCode])

  if (!isOpen) return null

  // Group vouchers into Free Shipping vs Discount
  const shippingVouchers = vouchers.filter((v) =>
    v.code.includes('SHIP') || v.title.toLowerCase().includes('ship')
  )
  const discountVouchers = vouchers.filter(
    (v) => !v.code.includes('SHIP') && !v.title.toLowerCase().includes('ship')
  )

  const handleApplyInputCode = async () => {
    setStatusMessage(null)
    const code = inputCode.trim().toUpperCase()
    if (!code) {
      setStatusMessage({ type: 'error', text: 'Vui lòng nhập mã voucher' })
      return
    }

    setIsApplyingCode(true)
    try {
      const res = await voucherApi.validateVoucher(code, orderValueMinor, storeId)
      if (res && res.isValid) {
        // If not in existing list, add it
        const exists = vouchers.find((v) => v.code === code)
        if (!exists) {
          const newVoucher: BackendVoucher = {
            id: res.voucherId || `custom-${code}`,
            code: res.code,
            title: `Giảm ${formatMoney(res.discountAmountMinor)}`,
            description: res.message,
            type: 'AMOUNT',
            discountValueMinor: res.discountAmountMinor,
            minOrderValueMinor: 0,
            maxDiscountAmountMinor: res.discountAmountMinor,
            startDate: '',
            endDate: '2026-12-31',
            usageLimit: 100,
            usedCount: 0,
            isActive: true,
          }
          setVouchers((prev) => [newVoucher, ...prev])
        }
        setSelectedCode(code)
        setStatusMessage({ type: 'success', text: `Mã ${code} đã được áp dụng hợp lệ!` })
      } else {
        // Check local fallback
        const local = DEFAULT_PLATFORM_VOUCHERS.find((v) => v.code === code)
        if (local) {
          if (orderValueMinor < local.minOrderValueMinor) {
            setStatusMessage({
              type: 'error',
              text: `Đơn hàng cần tối thiểu ${formatMoney(local.minOrderValueMinor)} để áp dụng mã này`,
            })
          } else {
            setSelectedCode(code)
            setStatusMessage({ type: 'success', text: `Mã ${code} đã được áp dụng hợp lệ!` })
          }
        } else {
          setStatusMessage({
            type: 'error',
            text: res?.message || 'Mã voucher không hợp lệ hoặc đã hết lượt sử dụng',
          })
        }
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Không thể kiểm tra voucher vào lúc này' })
    } finally {
      setIsApplyingCode(false)
    }
  }

  const handleToggleSelect = (voucher: BackendVoucher) => {
    const isEligible = orderValueMinor >= voucher.minOrderValueMinor
    if (!isEligible) return

    if (selectedCode === voucher.code) {
      setSelectedCode(null)
    } else {
      setSelectedCode(voucher.code)
    }
  }

  const handleConfirm = () => {
    if (!selectedCode) {
      onSelectVoucher(null)
      onClose()
      return
    }

    const matched = vouchers.find((v) => v.code === selectedCode)
    if (!matched) {
      onSelectVoucher(null)
      onClose()
      return
    }

    let discountMinor = 0
    if (matched.type === 'AMOUNT') {
      discountMinor = Math.min(matched.discountValueMinor, orderValueMinor)
    } else {
      const pct = (orderValueMinor * matched.discountValueMinor) / 100
      discountMinor = Math.min(Math.round(pct), matched.maxDiscountAmountMinor || Infinity)
    }

    const result: ValidateVoucherResult = {
      voucherId: matched.id,
      code: matched.code,
      isValid: true,
      discountAmountMinor: discountMinor,
      finalAmountMinor: Math.max(0, orderValueMinor - discountMinor),
      message: matched.title,
    }

    onSelectVoucher(result)
    onClose()
  }

  const renderTicket = (v: BackendVoucher, isShipping: boolean) => {
    const isEligible = orderValueMinor >= v.minOrderValueMinor
    const isSelected = selectedCode === v.code

    return (
      <div
        key={v.id || v.code}
        onClick={() => handleToggleSelect(v)}
        className={`shopee-ticket-card ${isSelected ? 'selected' : ''} ${!isEligible ? 'disabled' : ''}`}
      >
        {/* Left Stub */}
        <div className={`shopee-ticket-stub ${isShipping ? 'freeship' : 'discount'}`}>
          <div className="shopee-ticket-stub-badge">
            {isShipping ? 'Free Ship' : 'Chicky'}
          </div>
          <div className="shopee-ticket-stub-main">
            {isShipping
              ? 'FREE SHIP'
              : v.type === 'PERCENTAGE'
              ? `-${v.discountValueMinor}%`
              : `-${formatMoney(v.discountValueMinor)}`}
          </div>
          <div className="shopee-ticket-stub-sub">
            {isShipping ? 'Shipping Voucher' : 'Discount Voucher'}
          </div>
        </div>

        {/* Perforations */}
        <div className="shopee-ticket-perforation">
          <div className="shopee-ticket-notch-top" />
          <div className="shopee-ticket-notch-bottom" />
        </div>

        {/* Right Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="shopee-ticket-details">
            <div className="shopee-ticket-info">
              <div className="shopee-ticket-title-row">
                <span className="shopee-ticket-badge-limited">Limited</span>
                <span className="shopee-ticket-title">{v.title}</span>
              </div>

              <div className="shopee-ticket-min-spend">
                Đơn Tối Thiểu: <strong>{formatMoney(v.minOrderValueMinor)}</strong>
              </div>

              <span className="shopee-ticket-tag">
                {v.minOrderValueMinor === 0 ? 'Dành cho mọi đơn hàng' : 'Áp dụng toàn sàn'}
              </span>

              <div className="shopee-ticket-expiry">
                <span>HSD: 31.12.2026</span>
                <span>•</span>
                <span style={{ color: '#0284c7', cursor: 'pointer' }}>T&C</span>
              </div>
            </div>

            {/* Radio Selection Indicator */}
            <div className="shopee-ticket-radio-col">
              <div className="shopee-ticket-radio">
                {isSelected && <div className="shopee-ticket-radio-inner" />}
              </div>
            </div>
          </div>

          {/* Ineligible Warning Note */}
          {!isEligible && (
            <div className="shopee-ticket-warning">
              <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span>
                Cần mua thêm {formatMoney(v.minOrderValueMinor - orderValueMinor)} để đạt điều kiện sử dụng mã
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="shopee-voucher-modal-overlay">
      <div className="shopee-voucher-modal">
        {/* Header */}
        <div className="shopee-voucher-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ticket style={{ width: 22, height: 22, color: '#ee4d2d' }} />
            <h3 className="shopee-voucher-title">Select Chicky Voucher</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="shopee-voucher-help" title="Xem hướng dẫn sử dụng voucher">
              <HelpCircle style={{ width: 14, height: 14 }} />
              <span>Voucher Help</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shopee-voucher-close-btn"
              title="Đóng"
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>

        {/* Add Voucher Box */}
        <div className="shopee-voucher-input-box">
          <div className="shopee-voucher-input-row">
            <span className="shopee-voucher-input-label">Add Voucher</span>
            <input
              type="text"
              placeholder="Chicky voucher code (e.g. FREESHIP, CHICKY10)"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApplyInputCode()
                }
              }}
              className="shopee-voucher-input-field"
            />
            <button
              type="button"
              disabled={isApplyingCode || !inputCode.trim()}
              onClick={handleApplyInputCode}
              className={`shopee-voucher-apply-btn ${inputCode.trim() ? 'active' : ''}`}
            >
              {isApplyingCode ? 'CHECKING...' : 'APPLY'}
            </button>
          </div>

          {statusMessage && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: statusMessage.type === 'error' ? '#dc2626' : '#16a34a',
                padding: '4px 8px',
                borderRadius: 4,
                backgroundColor: statusMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
              }}
            >
              {statusMessage.type === 'error' ? '⚠️ ' : '✓ '}
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Vouchers List Body */}
        <div className="shopee-voucher-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
              Đang tải danh sách voucher ưu đãi...
            </div>
          ) : (
            <>
              {/* Free Shipping Vouchers */}
              {shippingVouchers.length > 0 && (
                <div>
                  <div className="shopee-voucher-section-title">Free Shipping</div>
                  <div className="shopee-voucher-section-subtitle">1 voucher can be selected</div>
                  {shippingVouchers.map((v) => renderTicket(v, true))}
                </div>
              )}

              {/* Discount Vouchers */}
              {discountVouchers.length > 0 && (
                <div>
                  <div className="shopee-voucher-section-title">Discount Voucher</div>
                  <div className="shopee-voucher-section-subtitle">1 voucher can be selected</div>
                  {discountVouchers.map((v) => renderTicket(v, false))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shopee-voucher-footer">
          <button
            type="button"
            onClick={onClose}
            className="shopee-voucher-btn-cancel"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="shopee-voucher-btn-ok"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
export default VoucherModal
