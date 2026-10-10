import React, { useState } from 'react'
import { X, Truck, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import type { SellerOrder, FulfillOrderPayload } from '../api/sellerApi'

export interface FulfillmentModalProps {
  order: SellerOrder
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: FulfillOrderPayload) => Promise<void>
}

const CARRIER_OPTIONS = [
  { id: 'Chicky Express Cold-Chain', name: 'Chicky Express Cold-Chain (0-4°C Guaranteed)', prefix: 'CK-EXP-' },
  { id: 'GHTK Express', name: 'GHTK (Giao Hang Tiet Kiem)', prefix: 'GHTK-' },
  { id: 'GHN Express', name: 'GHN (Giao Hang Nhanh)', prefix: 'GHN-' },
  { id: 'Viettel Post', name: 'Viettel Post Cold Freight', prefix: 'VTP-' },
  { id: 'VNPost', name: 'VNPost (Vietnam Post Logistics)', prefix: 'VNPOST-' },
]

export const FulfillmentModal: React.FC<FulfillmentModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [carrier, setCarrier] = useState<string>('Chicky Express Cold-Chain')
  const [trackingNumber, setTrackingNumber] = useState<string>(() => {
    return 'CK-EXP-' + Math.floor(100000 + Math.random() * 900000)
  })
  const [note, setNote] = useState<string>('')
  const [checkGelPacks, setCheckGelPacks] = useState<boolean>(true)
  const [checkSeal, setCheckSeal] = useState<boolean>(true)
  const [checkLabel, setCheckLabel] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCarrierChange = (newCarrierId: string) => {
    setCarrier(newCarrierId)
    const found = CARRIER_OPTIONS.find((c) => c.id === newCarrierId)
    const prefix = found ? found.prefix : 'WAYBILL-'
    setTrackingNumber(prefix + Math.floor(100000 + Math.random() * 900000))
  }

  const handleRegenerate = () => {
    const found = CARRIER_OPTIONS.find((c) => c.id === carrier)
    const p = found ? found.prefix : 'WAYBILL-'
    setTrackingNumber(p + Math.floor(100000 + Math.random() * 900000))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkGelPacks || !checkSeal || !checkLabel) {
      setErrorMsg('Please confirm all cold-chain packaging checkpoints before dispatching.')
      return
    }
    if (!trackingNumber.trim()) {
      setErrorMsg('Tracking number cannot be empty.')
      return
    }

    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        status: 'SHIPPING',
        carrier,
        trackingNumber: trackingNumber.trim(),
        reason: note.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="seller-modal-overlay">
      <div className="seller-modal-box" style={{ maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Modal Header */}
        <div className="seller-modal-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 className="seller-modal-title">Order Fulfillment & Dispatch</h3>
              <p className="seller-modal-subtitle">
                Assign carrier tracking code for Order #{order.orderCode}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="seller-modal-close-btn">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="seller-modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: 10,
                  color: '#b91c1c',
                  fontSize: 13,
                }}
              >
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Recipient Snapshot */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
                Deliver To: {order.recipientName} ({order.recipientPhone})
              </div>
              <div style={{ color: '#64748b' }}>{order.shippingAddress}</div>
            </div>

            {/* Select Carrier */}
            <div className="seller-form-group">
              <label className="seller-form-label">Logistics Carrier Partner *</label>
              <select
                value={carrier}
                onChange={(e) => handleCarrierChange(e.target.value)}
                className="seller-form-select"
              >
                {CARRIER_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking Code */}
            <div className="seller-form-group">
              <label className="seller-form-label">Waybill / Tracking Number *</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. CK-EXP-910238"
                  className="seller-form-input"
                  style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600 }}
                  required
                />
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="seller-regenerate-btn"
                  title="Generate new unique tracking code"
                >
                  <RefreshCw style={{ width: 13, height: 13 }} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Packaging Checklist */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: 6,
                }}
              >
                <ShieldCheck style={{ width: 16, height: 16, color: '#10b981' }} />
                <span>Quy Chuẩn Kiểm Hàng & Đóng Gói (Checklist)</span>
              </div>
              <div className="fulfillment-checklist">
                <label className="fulfillment-check-item">
                  <input
                    type="checkbox"
                    checked={checkSeal}
                    onChange={(e) => setCheckSeal(e.target.checked)}
                  />
                  <span>Sản phẩm nguyên seal/nguyên vẹn, đúng phân loại SKU và đủ số lượng.</span>
                </label>
                <label className="fulfillment-check-item">
                  <input
                    type="checkbox"
                    checked={checkGelPacks}
                    onChange={(e) => setCheckGelPacks(e.target.checked)}
                  />
                  <span>Đóng gói bọc xốp chống va đập/hộp carton đạt chuẩn sàn TMĐT.</span>
                </label>
                <label className="fulfillment-check-item">
                  <input
                    type="checkbox"
                    checked={checkLabel}
                    onChange={(e) => setCheckLabel(e.target.checked)}
                  />
                  <span>Phiếu giao hàng và tem vận đơn dán rõ ràng thông tin người nhận.</span>
                </label>
              </div>
            </div>

            {/* Dispatch Note */}
            <div className="seller-form-group">
              <label className="seller-form-label">Carrier Dispatch Note (Optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Handle with care, keep upright and chilled"
                className="seller-form-input"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="seller-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="seller-modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="seller-modal-submit-btn"
            >
              {isSubmitting ? (
                'Processing Dispatch...'
              ) : (
                <>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  <span>Handover to Carrier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FulfillmentModal
