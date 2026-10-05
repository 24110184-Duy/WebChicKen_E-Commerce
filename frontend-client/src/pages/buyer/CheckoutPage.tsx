import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { useCartStore } from '../../app/store/cartStore'
import { formatMoney } from '../../shared/lib/formatMoney'
import { PATHS } from '../../app/router/paths'
import {
  MOCK_SHIPPING_METHODS,
  MOCK_VOUCHERS,
  type ShippingMethod,
  type Voucher,
} from '../../features/cart/types/cartTypes'
import { orderApi } from '../../features/orders/api/orderApi'
import { paymentApi } from '../../features/payment/api/paymentApi'
import { VoucherModal } from '../../features/cart/components/VoucherModal'

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { selectedItems, removeItem } = useCartStore()
  const isOrderPlacedRef = useRef(false)

  // Delivery Address State
  const [address, setAddress] = useState({
    recipientName: 'Nguyen Van A',
    phoneNumber: '0901234567',
    streetAddress: '123 Farm Green Road, Ward 5',
    district: 'District 1',
    city: 'Ho Chi Minh City',
  })
  const [isEditingAddress, setIsEditingAddress] = useState(false)

  // Shipping Method Selection per Store
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod>(
    MOCK_SHIPPING_METHODS[0]
  )

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER' | 'VNPAY'>('COD')

  // Voucher State
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)

  // Order Placement Loading State
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load voucher from cart session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('webchicken_checkout_voucher')
      if (stored) {
        setAppliedVoucher(JSON.parse(stored))
      }
    } catch {
      // Ignore
    }
  }, [])

  // If no items are selected, redirect back to cart (only if order is not placed yet)
  useEffect(() => {
    if (selectedItems.length === 0 && !isOrderPlacedRef.current) {
      navigate(PATHS.CART, { replace: true })
    }
  }, [selectedItems, navigate])

  // Group selected items by store
  const itemsByStore = selectedItems.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [],
      }
    }
    acc[item.storeId].items.push(item)
    return acc
  }, {} as Record<string, { storeId: string; storeName: string; items: typeof selectedItems }>)

  const storeGroups = Object.values(itemsByStore)

  // Calculations
  const merchandiseSubtotalMinor = selectedItems.reduce(
    (sum, i) => sum + i.priceMinor * i.quantity,
    0
  )

  // Shipping fee total (per store count * shipping fee)
  const shippingTotalMinor = selectedShippingMethod.feeMinor * (storeGroups.length || 1)

  // Voucher discount
  let voucherDiscountMinor = 0
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'AMOUNT') {
      voucherDiscountMinor = Math.min(appliedVoucher.discountValue, merchandiseSubtotalMinor)
    } else {
      const pct = (merchandiseSubtotalMinor * appliedVoucher.discountValue) / 100
      voucherDiscountMinor = Math.min(pct, appliedVoucher.maxDiscountMinor)
    }
  }

  const grandTotalMinor = Math.max(0, merchandiseSubtotalMinor + shippingTotalMinor - voucherDiscountMinor)

  // Handle Voucher Apply
  const handleApplyVoucher = (codeToApply?: string) => {
    const code = (codeToApply || voucherCodeInput).trim().toUpperCase()
    setVoucherError(null)

    if (!code) {
      setVoucherError('Please enter a voucher code')
      return
    }

    const found = MOCK_VOUCHERS.find((v) => v.code === code && v.isActive)
    if (!found) {
      setVoucherError('Invalid or expired voucher code')
      return
    }

    if (merchandiseSubtotalMinor < found.minOrderValueMinor) {
      setVoucherError(`Order must be at least ${formatMoney(found.minOrderValueMinor)}`)
      return
    }

    setAppliedVoucher(found)
    setVoucherCodeInput(found.code)
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCodeInput('')
    setVoucherError(null)
    sessionStorage.removeItem('webchicken_checkout_voucher')
  }

  // Handle Place Order
  const handlePlaceOrder = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const checkoutReq = {
        items: selectedItems.map((i) => ({
          productId: i.productId,
          variantId: i.skuId !== i.productId ? i.skuId : undefined,
          quantity: i.quantity,
        })),
        recipientName: address.recipientName,
        recipientPhone: address.phoneNumber,
        shippingAddress: `${address.streetAddress}, ${address.district}, ${address.city}`,
        voucherCode: appliedVoucher?.code,
        paymentMethod: paymentMethod === 'COD' ? ('COD' as const) : paymentMethod === 'BANK_TRANSFER' ? ('BANKING' as const) : ('VNPAY' as const),
        note: 'Customer order from storefront checkout',
      }

      const res = await orderApi.checkout(checkoutReq)
      const primaryOrderCode = res && res.orders && res.orders.length > 0
        ? res.orders[0].orderCode
        : `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`

      const orderSummary = {
        orderCode: primaryOrderCode,
        orderGroupId: res?.orderGroupId,
        orders: res?.orders,
        createdAt: new Date().toISOString(),
        recipient: address,
        items: selectedItems,
        shippingMethod: selectedShippingMethod,
        paymentMethod,
        merchandiseSubtotalMinor,
        shippingTotalMinor,
        voucherDiscountMinor,
        grandTotalMinor,
      }

      isOrderPlacedRef.current = true
      sessionStorage.setItem('webchicken_last_order', JSON.stringify(orderSummary))
      selectedItems.forEach((i) => removeItem(i.skuId))
      sessionStorage.removeItem('webchicken_checkout_voucher')

      // If VNPAY is selected, request VNPay gateway URL
      if (paymentMethod === 'VNPAY') {
        const vnpayUrl = await paymentApi.createVNPayUrl(primaryOrderCode, grandTotalMinor)
        if (vnpayUrl) {
          setIsSubmitting(false)
          window.location.href = vnpayUrl
          return
        }
      }

      setIsSubmitting(false)
      navigate(PATHS.PAYMENT_RESULT, { replace: true })
    } catch {
      setIsSubmitting(false)
      alert('Unable to complete order placement. Please try again.')
    }
  }

  if (selectedItems.length === 0 && !isOrderPlacedRef.current) {
    return null
  }

  return (
    <StorefrontLayout>
      <div className="checkout-page-container">
        {/* Breadcrumb */}
        <div className="checkout-breadcrumb">
          <Link to={PATHS.HOME}>Home</Link>
          <span className="checkout-breadcrumb-sep">/</span>
          <Link to={PATHS.CART}>Cart</Link>
          <span className="checkout-breadcrumb-sep">/</span>
          <span className="checkout-breadcrumb-current">Checkout</span>
        </div>

        {/* Title */}
        <div className="checkout-title-row">
          <h1 className="checkout-main-title">Secure Checkout</h1>
          <p className="checkout-subtitle">Review items, confirm delivery address, and complete your order</p>
        </div>

        {/* Two-Column Layout */}
        <div className="checkout-layout">
          {/* Left Column: Form & Steps */}
          <div>
            {/* Step 1: Delivery Address */}
            <div className="checkout-section-card">
              <div className="checkout-section-header">
                <div className="checkout-section-title">
                  <span className="checkout-section-step">1</span>
                  <span>Delivery Address</span>
                </div>
                <button
                  type="button"
                  className="checkout-link-action"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                >
                  {isEditingAddress ? 'Done Editing' : 'Change Address'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="checkout-address-form">
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">Full Name</label>
                    <input
                      type="text"
                      className="checkout-form-input"
                      value={address.recipientName}
                      onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">Phone Number</label>
                    <input
                      type="text"
                      className="checkout-form-input"
                      value={address.phoneNumber}
                      onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="checkout-form-group full">
                    <label className="checkout-form-label">Street Address</label>
                    <input
                      type="text"
                      className="checkout-form-input"
                      value={address.streetAddress}
                      onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">District</label>
                    <input
                      type="text"
                      className="checkout-form-input"
                      value={address.district}
                      onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">City</label>
                    <input
                      type="text"
                      className="checkout-form-input"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="checkout-address-box">
                  <span className="checkout-address-tag">Default Address</span>
                  <div className="checkout-address-name">{address.recipientName}</div>
                  <div className="checkout-address-phone">{address.phoneNumber}</div>
                  <div className="checkout-address-text">
                    {address.streetAddress}, {address.district}, {address.city}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Order Items & Delivery Method */}
            <div className="checkout-section-card">
              <div className="checkout-section-header">
                <div className="checkout-section-title">
                  <span className="checkout-section-step">2</span>
                  <span>Items & Shipping Review</span>
                </div>
                <Link to={PATHS.CART} className="checkout-link-action">
                  Edit Cart
                </Link>
              </div>

              {storeGroups.map((group) => (
                <div key={group.storeId} className="checkout-store-block">
                  <div className="checkout-store-header">
                    <span>Farm Store: {group.storeName}</span>
                  </div>

                  {group.items.map((item) => (
                    <div key={item.skuId} className="checkout-item-row">
                      <div className="checkout-item-info">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="checkout-item-thumb"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=150&q=80'
                          }}
                        />
                        <div>
                          <div className="checkout-item-name">{item.name}</div>
                          {item.skuName && (
                            <div className="checkout-item-variant">Variant: {item.skuName}</div>
                          )}
                        </div>
                      </div>

                      <div className="checkout-item-pricing">
                        <div className="checkout-item-qty">Qty: {item.quantity}</div>
                        <div className="checkout-item-price">
                          {formatMoney(item.priceMinor * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Shipping Method Pills */}
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Select Delivery Service
                </label>
                <div className="checkout-shipping-pills">
                  {MOCK_SHIPPING_METHODS.map((method) => {
                    const isSelected = selectedShippingMethod.id === method.id
                    return (
                      <div
                        key={method.id}
                        className={`checkout-shipping-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedShippingMethod(method)}
                      >
                        <div className="checkout-shipping-pill-header">
                          <span>{method.name}</span>
                          <span className="checkout-shipping-pill-fee">{formatMoney(method.feeMinor)}</span>
                        </div>
                        <div className="checkout-shipping-pill-time">{method.estimatedTime}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="checkout-section-card">
              <div className="checkout-section-header">
                <div className="checkout-section-title">
                  <span className="checkout-section-step">3</span>
                  <span>Payment Method</span>
                </div>
              </div>

              <div className="checkout-payment-methods">
                {/* 1. COD */}
                <div
                  className={`checkout-payment-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    className="checkout-payment-radio"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <div className="checkout-payment-details">
                    <div className="checkout-payment-name">Cash on Delivery (COD)</div>
                    <div className="checkout-payment-desc">
                      Pay in cash upon doorstep delivery after inspecting the fresh poultry package.
                    </div>
                  </div>
                </div>

                {/* 2. Bank Transfer / QR */}
                <div
                  className={`checkout-payment-card ${paymentMethod === 'BANK_TRANSFER' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    className="checkout-payment-radio"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  />
                  <div className="checkout-payment-details">
                    <div className="checkout-payment-name">VietQR / Bank Transfer (Instant Verification)</div>
                    <div className="checkout-payment-desc">
                      Scan dynamic VietQR using Vietcombank, Techcombank, MB Bank, or Momo for immediate payment.
                    </div>
                  </div>
                </div>

                {/* 3. VNPAY Gateway */}
                <div
                  className={`checkout-payment-card ${paymentMethod === 'VNPAY' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('VNPAY')}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    className="checkout-payment-radio"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={() => setPaymentMethod('VNPAY')}
                  />
                  <div className="checkout-payment-details">
                    <div className="checkout-payment-name">VNPAY-QR / Online Payment (Sandbox)</div>
                    <div className="checkout-payment-desc">
                      Pay securely via Domestic ATM Card, VietQR, Visa/MasterCard, or VNPAY E-Wallet through official sandbox gateway.
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic QR Display for Bank Transfer */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="checkout-qr-box">
                  <div className="checkout-qr-placeholder">
                    <span>VIETQR MOCK</span>
                    <span style={{ fontSize: 10, marginTop: 4 }}>CHICKYMART</span>
                  </div>
                  <div className="checkout-qr-info">
                    Bank: <strong>MBBank</strong> | Account: <strong>0901234567</strong> | Beneficiary: <strong>CHICKYMART CO LTD</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div>
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-title">Summary & Payment</h2>

              {/* Voucher Apply Block */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Voucher Code
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="cart-voucher-input"
                    placeholder="ENTER CODE"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value)}
                  />
                  {appliedVoucher ? (
                    <button
                      type="button"
                      className="cart-voucher-apply-btn"
                      style={{ backgroundColor: '#ef4444' }}
                      onClick={handleRemoveVoucher}
                    >
                      Remove
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="cart-voucher-apply-btn"
                        onClick={() => handleApplyVoucher()}
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className="cart-voucher-apply-btn"
                        style={{ backgroundColor: '#f59e0b', color: '#111827', whiteSpace: 'nowrap' }}
                        onClick={() => setIsVoucherModalOpen(true)}
                      >
                        Select Voucher
                      </button>
                    </div>
                  )}
                </div>

                {voucherError && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6, fontWeight: 500 }}>
                    {voucherError}
                  </div>
                )}

                {appliedVoucher && (
                  <div style={{ fontSize: 12, color: '#16a34a', marginTop: 6, fontWeight: 600 }}>
                    Applied: {appliedVoucher.code} ({appliedVoucher.title})
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="checkout-summary-row">
                <span>Merchandise Subtotal</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {formatMoney(merchandiseSubtotalMinor)}
                </span>
              </div>

              <div className="checkout-summary-row">
                <span>Shipping Fee</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {formatMoney(shippingTotalMinor)}
                </span>
              </div>

              {voucherDiscountMinor > 0 && (
                <div className="checkout-summary-row discount">
                  <span>Voucher Savings</span>
                  <span>- {formatMoney(voucherDiscountMinor)}</span>
                </div>
              )}

              <div className="checkout-summary-row total">
                <span>Total Payment</span>
                <span className="checkout-summary-total-val">{formatMoney(grandTotalMinor)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="checkout-submit-btn"
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order Now'}
              </button>

              <p className="checkout-policy-notice">
                By placing this order, you agree to ChickyMart Terms of Service and Farm Safety Inspection Policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <VoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        orderValueMinor={merchandiseSubtotalMinor}
        onSelectVoucher={(v) => {
          setAppliedVoucher({
            voucherId: v.voucherId,
            code: v.code,
            title: v.code,
            description: `Discount ${formatMoney(v.discountAmountMinor)}`,
            discountType: 'AMOUNT',
            discountValue: v.discountAmountMinor,
            minOrderValueMinor: 0,
            maxDiscountMinor: v.discountAmountMinor,
            isActive: true,
            startDate: '',
            endDate: '',
          })
          setVoucherCodeInput(v.code)
        }}
      />
    </StorefrontLayout>
  )
}
