import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { useCartStore } from '../../app/store/cartStore'
import { formatMoney } from '../../shared/lib/formatMoney'
import { PATHS } from '../../app/router/paths'
import {
  MOCK_SHIPPING_METHODS,
  type ShippingMethod,
  type Voucher,
} from '../../features/cart/types/cartTypes'
import { orderApi } from '../../features/orders/api/orderApi'
import { paymentApi } from '../../features/payment/api/paymentApi'
import { VoucherModal } from '../../features/cart/components/VoucherModal'
import { AddressSelectModal } from '../../features/orders/components/AddressSelectModal'
import { customerApi, type AddressResponse } from '../../features/auth/api/customerApi'
import { Ticket } from 'lucide-react'

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { selectedItems, removeItem } = useCartStore()
  const isOrderPlacedRef = useRef(false)

  // Delivery Address State from Profile
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>()
  const [address, setAddress] = useState({
    recipientName: '',
    phoneNumber: '',
    streetAddress: '',
    district: '',
    city: '',
    isDefault: false,
  })
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  // Load user delivery addresses from profile on mount
  useEffect(() => {
    customerApi.getAddresses().then((res) => {
      if (res && res.length > 0) {
        setAddresses(res)
        const defaultAddr = res.find((a) => a.isDefault) || res[0]
        setSelectedAddressId(defaultAddr.addressId)
        setAddress({
          recipientName: defaultAddr.recipientName,
          phoneNumber: defaultAddr.phone,
          streetAddress: defaultAddr.addressLine1,
          district: defaultAddr.district || '',
          city: defaultAddr.city || '',
          isDefault: defaultAddr.isDefault,
        })
      }
    })
  }, [])

  const handleSelectAddress = (selected: AddressResponse) => {
    setSelectedAddressId(selected.addressId)
    setAddress({
      recipientName: selected.recipientName,
      phoneNumber: selected.phone,
      streetAddress: selected.addressLine1,
      district: selected.district || '',
      city: selected.city || '',
      isDefault: selected.isDefault,
    })
  }

  const handleAddressCreated = (newAddr: AddressResponse) => {
    setAddresses((prev) => [newAddr, ...prev.filter((a) => a.addressId !== newAddr.addressId)])
  }

  // Shipping Method Selection per Store
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod>(
    MOCK_SHIPPING_METHODS[0]
  )

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER' | 'VNPAY'>('COD')

  // Voucher State
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
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

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    sessionStorage.removeItem('webchicken_checkout_voucher')
  }

  // Handle Place Order
  const handlePlaceOrder = async () => {
    if (isSubmitting) return

    if (!address.recipientName.trim() || !address.phoneNumber.trim() || !address.streetAddress.trim()) {
      alert('Vui lòng chọn hoặc thiết lập địa chỉ nhận hàng trước khi tiến hành đặt hàng!')
      setIsAddressModalOpen(true)
      return
    }

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
        shippingAddress: `${address.streetAddress}${address.district ? `, ${address.district}` : ''}${address.city ? `, ${address.city}` : ''}`,
        voucherCode: appliedVoucher?.code,
        paymentMethod: paymentMethod === 'COD' ? ('COD' as const) : paymentMethod === 'BANK_TRANSFER' ? ('BANKING' as const) : ('VNPAY' as const),
        note: 'Customer order from storefront checkout',
      }

      const res = await orderApi.checkout(checkoutReq)
      if (!res || !res.orders || res.orders.length === 0) {
        setIsSubmitting(false)
        alert('Đặt hàng không thành công. Vui lòng thử lại sau!')
        return
      }

      const primaryOrderCode = res.orders[0].orderCode

      const orderSummary = {
        orderCode: primaryOrderCode,
        orderGroupId: res.orderGroupId,
        orders: res.orders,
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
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  Change Address
                </button>
              </div>

              {address.recipientName ? (
                <div className="checkout-address-box">
                  {address.isDefault && <span className="checkout-address-tag">Default Address</span>}
                  <div className="checkout-address-name">{address.recipientName}</div>
                  <div className="checkout-address-phone">{address.phoneNumber}</div>
                  <div className="checkout-address-text">
                    {address.streetAddress}
                    {address.district ? `, ${address.district}` : ''}
                    {address.city ? `, ${address.city}` : ''}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-amber-50/50 border border-dashed border-amber-300 rounded-xl text-center">
                  <p className="text-sm font-semibold text-slate-800 mb-1">Chưa có địa chỉ nhận hàng</p>
                  <p className="text-xs text-slate-500 mb-3">Vui lòng chọn địa chỉ trong tài khoản hoặc thêm mới để tiếp tục.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-colors"
                  >
                    + Chọn Hoặc Thêm Địa Chỉ
                  </button>
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
                    <span>Gian hàng: {group.storeName}</span>
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
                      Pay in cash upon doorstep delivery after inspecting the package.
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
                    <span>VIETQR / CHUYỂN KHOẢN</span>
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
              {/* Platform Voucher Bar (Shopee Style) */}
              <div
                className="platform-voucher-bar"
                onClick={() => setIsVoucherModalOpen(true)}
              >
                <div className="platform-voucher-left">
                  <Ticket className="platform-voucher-icon" />
                  <span>Platform Voucher</span>
                  {appliedVoucher && (
                    <span className="platform-voucher-applied-badge">
                      {appliedVoucher.code} (-{formatMoney(voucherDiscountMinor)})
                    </span>
                  )}
                </div>

                <div className="platform-voucher-right">
                  <span>{appliedVoucher ? 'Change' : 'Select or enter code'}</span>
                  {appliedVoucher && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveVoucher()
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                      title="Remove voucher"
                    >
                      ✕
                    </button>
                  )}
                </div>
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
                By placing this order, you agree to WebChicKen Marketplace Terms of Service and Customer Protection Policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <VoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        orderValueMinor={merchandiseSubtotalMinor}
        appliedVoucherCode={appliedVoucher?.code}
        onSelectVoucher={(v) => {
          if (!v) {
            handleRemoveVoucher()
            return
          }
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
        }}
      />

      <AddressSelectModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={handleSelectAddress}
        onAddressCreated={handleAddressCreated}
      />
    </StorefrontLayout>
  )
}
