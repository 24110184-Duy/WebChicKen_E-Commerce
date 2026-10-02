import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { formatMoney } from '../../shared/lib/formatMoney'
import { PATHS } from '../../app/router/paths'

interface OrderData {
  orderCode: string
  createdAt: string
  recipient: {
    recipientName: string
    phoneNumber: string
    streetAddress: string
    district: string
    city: string
  }
  shippingMethod: {
    name: string
    estimatedTime: string
  }
  paymentMethod: string
  grandTotalMinor: number
}

export const PaymentResultPage: React.FC = () => {
  const [order, setOrder] = useState<OrderData | null>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('webchicken_last_order')
      if (stored) {
        setOrder(JSON.parse(stored))
      }
    } catch {
      // Ignore
    }
  }, [])

  const defaultOrder: OrderData = {
    orderCode: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-789123`,
    createdAt: new Date().toISOString(),
    recipient: {
      recipientName: 'Nguyen Van A',
      phoneNumber: '0901234567',
      streetAddress: '123 Farm Green Road, Ward 5',
      district: 'District 1',
      city: 'Ho Chi Minh City',
    },
    shippingMethod: {
      name: 'Express Farm-to-Door 2H',
      estimatedTime: 'Within 2 hours (Cold Chain Guaranteed)',
    },
    paymentMethod: 'COD',
    grandTotalMinor: 370000,
  }

  const currentOrder = order || defaultOrder

  const paymentMethodLabel = {
    COD: 'Cash on Delivery (COD)',
    BANK_TRANSFER: 'VietQR / Instant Bank Transfer',
    CARD: 'Credit or Debit Card',
  }[currentOrder.paymentMethod] || currentOrder.paymentMethod

  return (
    <StorefrontLayout>
      <div className="checkout-page-container">
        <div className="result-card">
          <span className="result-badge success">Order Confirmed</span>
          <h1 className="result-title">Thank You For Your Order!</h1>
          <p className="result-desc">
            Your fresh poultry order has been sent to our partner farm. We are carefully selecting and packaging your items under strict cold-chain food safety standards.
          </p>

          <div className="result-order-box">
            <div className="result-order-row">
              <span>Order Reference Number</span>
              <span className="result-order-code">{currentOrder.orderCode}</span>
            </div>

            <div className="result-order-row">
              <span>Recipient Name</span>
              <span style={{ fontWeight: 600 }}>{currentOrder.recipient.recipientName}</span>
            </div>

            <div className="result-order-row">
              <span>Contact Phone</span>
              <span>{currentOrder.recipient.phoneNumber}</span>
            </div>

            <div className="result-order-row">
              <span>Delivery Address</span>
              <span>
                {currentOrder.recipient.streetAddress}, {currentOrder.recipient.district}, {currentOrder.recipient.city}
              </span>
            </div>

            <div className="result-order-row">
              <span>Delivery Service</span>
              <span>{currentOrder.shippingMethod.name} ({currentOrder.shippingMethod.estimatedTime})</span>
            </div>

            <div className="result-order-row">
              <span>Payment Method</span>
              <span>{paymentMethodLabel}</span>
            </div>

            <div className="result-order-row highlight">
              <span>Total Amount</span>
              <span style={{ color: '#b45309', fontSize: 18 }}>
                {formatMoney(currentOrder.grandTotalMinor)}
              </span>
            </div>
          </div>

          <div className="result-actions">
            <Link to={PATHS.ACCOUNT.ORDERS} className="result-btn-primary">
              View Order Status
            </Link>
            <Link to={PATHS.HOME} className="result-btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}
