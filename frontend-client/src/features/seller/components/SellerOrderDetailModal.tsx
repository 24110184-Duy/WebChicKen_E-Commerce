import React, { useState } from 'react'
import {
  X,
  Package,
  Calendar,
  User,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Ban,
  Clock,
} from 'lucide-react'
import type { SellerOrder } from '../api/sellerApi'


export interface SellerOrderDetailModalProps {
  order: SellerOrder | null
  isOpen: boolean
  onClose: () => void
  onConfirmOrder: (order: SellerOrder) => void
  onOpenFulfillment: (order: SellerOrder) => void
  onMarkDelivered: (order: SellerOrder) => void
  onCancelOrder: (order: SellerOrder) => void
}

export const SellerOrderDetailModal: React.FC<SellerOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmOrder,
  onOpenFulfillment,
  onMarkDelivered,
  onCancelOrder,
}) => {
  const [copied, setCopied] = useState<boolean>(false)

  if (!isOpen || !order) return null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(order.orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatVND = (minor: number) => {
    return new Intl.NumberFormat('vi-VN').format(minor) + ' ₫'
  }

  // Stepper calculations
  const isCancelled = order.status === 'CANCELLED'
  const isReturned = order.status === 'RETURNED'
  const stepPlaced = true
  const stepConfirmed = order.status === 'CONFIRMED' || order.status === 'SHIPPING' || order.status === 'DELIVERED'
  const stepShipping = order.status === 'SHIPPING' || order.status === 'DELIVERED'
  const stepDelivered = order.status === 'DELIVERED'

  return (
    <div className="seller-modal-overlay">
      <div className="seller-modal-box" style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="seller-modal-header" style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#fffbeb',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="seller-modal-title" style={{ fontFamily: 'monospace' }}>
                  #{order.orderCode}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="seller-filter-btn"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  title="Copy Order Code"
                >
                  {copied ? <Check style={{ width: 12, height: 12, color: '#10b981' }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <span className={`order-badge order-badge-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                <Calendar style={{ width: 13, height: 13 }} />
                <span>Placed on {new Date(order.orderDate).toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="seller-filter-btn"
              title="Print Packing Slip / Receipt"
            >
              <Printer style={{ width: 15, height: 15 }} />
              <span>Print Slip</span>
            </button>
            <button type="button" onClick={onClose} className="seller-modal-close-btn">
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="seller-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. Fulfillment Stepper Timeline */}
          {!isCancelled && !isReturned && (
            <div className="seller-timeline-stepper">
              <div className="seller-timeline-step">
                <div className={`seller-timeline-circle ${stepPlaced ? 'completed' : ''}`}>
                  <Check style={{ width: 16, height: 16 }} />
                </div>
                <span className="seller-timeline-label active">Order Placed</span>
              </div>
              <div className={`seller-timeline-connector ${stepConfirmed ? 'completed' : ''}`} />

              <div className="seller-timeline-step">
                <div className={`seller-timeline-circle ${stepConfirmed ? 'completed' : order.status === 'PENDING' ? 'active' : ''}`}>
                  {stepConfirmed ? <Check style={{ width: 16, height: 16 }} /> : <Clock style={{ width: 16, height: 16 }} />}
                </div>
                <span className={`seller-timeline-label ${stepConfirmed ? 'active' : ''}`}>Confirmed</span>
              </div>
              <div className={`seller-timeline-connector ${stepShipping ? 'completed' : ''}`} />

              <div className="seller-timeline-step">
                <div className={`seller-timeline-circle ${stepShipping ? 'completed' : order.status === 'CONFIRMED' ? 'active' : ''}`}>
                  {stepShipping ? <Check style={{ width: 16, height: 16 }} /> : <Truck style={{ width: 16, height: 16 }} />}
                </div>
                <span className={`seller-timeline-label ${stepShipping ? 'active' : ''}`}>Dispatched</span>
              </div>
              <div className={`seller-timeline-connector ${stepDelivered ? 'completed' : ''}`} />

              <div className="seller-timeline-step">
                <div className={`seller-timeline-circle ${stepDelivered ? 'completed' : ''}`}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                </div>
                <span className={`seller-timeline-label ${stepDelivered ? 'active' : ''}`}>Delivered</span>
              </div>
            </div>
          )}

          {isCancelled && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: 12,
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
              }}
            >
              <Ban style={{ width: 18, height: 18 }} />
              <div>
                <strong>Order Cancelled:</strong> This order has been voided. Any reserved inventory has been restored.
              </div>
            </div>
          )}

          {/* 2. Customer & Delivery Information */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              padding: 16,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Recipient Details
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                <User style={{ width: 15, height: 15, color: '#f59e0b' }} />
                <span>{order.recipientName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 6 }}>
                <Phone style={{ width: 15, height: 15, color: '#64748b' }} />
                <span>{order.recipientPhone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569' }}>
                <MapPin style={{ width: 15, height: 15, color: '#64748b', flexShrink: 0, marginTop: 2 }} />
                <span>{order.shippingAddress}</span>
              </div>
              {order.note && (
                <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: '#fffbeb', borderRadius: 8, fontSize: 12, color: '#b45309' }}>
                  <strong>Buyer Note:</strong> {order.note}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Payment & Logistics
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0f172a', marginBottom: 6 }}>
                <CreditCard style={{ width: 15, height: 15, color: '#3b82f6' }} />
                <span>Payment: <strong>{order.paymentMethod}</strong></span>
                <span className={`pay-badge pay-badge-${order.paymentStatus.toLowerCase()}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.carrier && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
                  <Truck style={{ width: 15, height: 15, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div>Carrier: <strong>{order.carrier}</strong></div>
                    {order.trackingNumber && (
                      <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#2563eb' }}>
                        Tracking: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {order.dispatchedAt && (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Dispatched at: {new Date(order.dispatchedAt).toLocaleString('en-US')}
                </div>
              )}
            </div>
          </div>

          {/* 3. Items Table */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              Order Line Items ({order.items.length})
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <table className="seller-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'center' }}>Unit Price</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={item.imageUrl || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100'}
                            alt={item.productName}
                            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a' }}>
                              {item.productName}
                            </div>
                            {item.variantName && (
                              <div style={{ fontSize: 12, color: '#64748b' }}>
                                Variant: {item.variantName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: 13, color: '#475569' }}>
                        {formatVND(item.unitPriceAtPurchaseMinor)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13.5 }}>
                        x{item.quantity}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>
                        {formatVND(item.unitPriceAtPurchaseMinor * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Financial Breakdown */}
          <div
            style={{
              alignSelf: 'flex-end',
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 16,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Items Subtotal:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {formatVND(order.totalAmountMinor - order.shippingFeeMinor + order.discountAmountMinor)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Shipping Fee:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                +{formatVND(order.shippingFeeMinor)}
              </span>
            </div>
            {order.discountAmountMinor > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Voucher Discount:</span>
                <span style={{ fontWeight: 700 }}>
                  -{formatVND(order.discountAmountMinor)}
                </span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTop: '1.5px solid #cbd5e1',
                fontSize: 15,
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              <span>Total Receivable:</span>
              <span style={{ color: '#b45309' }}>{formatVND(order.totalAmountMinor)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Context Actions */}
        <div className="seller-modal-footer">
          <button type="button" onClick={onClose} className="seller-modal-cancel-btn">
            Close
          </button>

          {order.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => onCancelOrder(order)}
                className="seller-modal-cancel-btn"
                style={{ color: '#ef4444', borderColor: '#fecaca' }}
              >
                Reject Order
              </button>
              <button
                type="button"
                onClick={() => onConfirmOrder(order)}
                className="seller-modal-submit-btn"
              >
                Accept & Confirm Order
              </button>
            </>
          )}

          {order.status === 'CONFIRMED' && (
            <>
              <button
                type="button"
                onClick={() => onCancelOrder(order)}
                className="seller-modal-cancel-btn"
                style={{ color: '#ef4444', borderColor: '#fecaca' }}
              >
                Cancel Order
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenFulfillment(order)
                }}
                className="seller-modal-submit-btn"
                style={{ backgroundColor: '#2563eb' }}
              >
                <Truck style={{ width: 16, height: 16 }} />
                <span>Dispatch / Fulfill Order</span>
              </button>
            </>
          )}

          {order.status === 'SHIPPING' && (
            <button
              type="button"
              onClick={() => onMarkDelivered(order)}
              className="seller-modal-submit-btn"
              style={{ backgroundColor: '#10b981' }}
            >
              <CheckCircle2 style={{ width: 16, height: 16 }} />
              <span>Mark as Delivered</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerOrderDetailModal
