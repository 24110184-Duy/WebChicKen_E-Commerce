import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { useCartStore } from '../../app/store/cartStore'
import { formatMoney } from '../../shared/lib/formatMoney'
import { PATHS } from '../../app/router/paths'
import {
  SHIPPING_METHODS,
  type ShippingMethod,
  type Voucher,
} from '../../features/cart/types/cartTypes'
import { orderApi } from '../../features/orders/api/orderApi'
import { paymentApi } from '../../features/payment/api/paymentApi'
import { VoucherModal } from '../../features/cart/components/VoucherModal'
import { AddressSelectModal } from '../../features/orders/components/AddressSelectModal'
import { customerApi, type AddressResponse } from '../../features/auth/api/customerApi'
import { Ticket, X, Copy, Check, Clock } from 'lucide-react'
import { toast } from '../../components/feedback/Toast'
import { resolveImageUrl, handleImageFallback } from '../../shared/utils/imageUrl'

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
    SHIPPING_METHODS[0]
  )

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER' | 'VNPAY'>('COD')

  // Voucher State
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)

  // Order Placement Loading State
  const [isSubmitting, setIsSubmitting] = useState(false)

  // VietQR Modal State
  const [vietQrModal, setVietQrModal] = useState<{
    isOpen: boolean
    orderCode: string
    amountMinor: number
    orderSummary: any
    countdown: number
    isCancelling: boolean
  }>({
    isOpen: false,
    orderCode: '',
    amountMinor: 0,
    orderSummary: null,
    countdown: 900,
    isCancelling: false,
  })
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const activeQrOrderCodeRef = useRef<string | null>(null)

  useEffect(() => {
    activeQrOrderCodeRef.current = vietQrModal.isOpen ? vietQrModal.orderCode : null
  }, [vietQrModal.isOpen, vietQrModal.orderCode])

  // Tự động hủy đơn hàng QR chưa quét nếu người dùng điều hướng rời trang hoặc quay lại Home/Cart
  useEffect(() => {
    return () => {
      const code = activeQrOrderCodeRef.current
      if (code && !isOrderPlacedRef.current) {
        orderApi.cancelOrder(code, 'Khách hàng rời khỏi trang khi chưa quét mã QR').catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (!vietQrModal.isOpen) return
    if (vietQrModal.countdown <= 0) {
      handleCancelVietQr()
      toast.warning('Đã hết hạn thời gian quét mã QR. Đơn hàng đã được tự động hủy.')
      return
    }
    const timer = setInterval(() => {
      setVietQrModal((prev) => {
        if (prev.countdown <= 1) {
          clearInterval(timer)
          return { ...prev, countdown: 0 }
        }
        return { ...prev, countdown: prev.countdown - 1 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [vietQrModal.isOpen, vietQrModal.countdown])

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCancelVietQr = async () => {
    const code = vietQrModal.orderCode
    activeQrOrderCodeRef.current = null
    setVietQrModal((prev) => ({ ...prev, isCancelling: true }))
    try {
      if (code) {
        await orderApi.cancelOrder(code, 'Khách hàng hủy quét mã VietQR')
      }
    } catch (e) {
      console.warn('Cancel order error:', e)
    } finally {
      setVietQrModal({
        isOpen: false,
        orderCode: '',
        amountMinor: 0,
        orderSummary: null,
        countdown: 900,
        isCancelling: false,
      })
      toast.info('Đã hủy quét mã QR. Các sản phẩm vẫn nằm trong giỏ hàng của bạn.')
    }
  }

  const handleConfirmVietQrPaid = () => {
    isOrderPlacedRef.current = true
    activeQrOrderCodeRef.current = null
    if (vietQrModal.orderSummary) {
      sessionStorage.setItem('webchicken_last_order', JSON.stringify(vietQrModal.orderSummary))
    }
    selectedItems.forEach((i) => removeItem(i.skuId))
    sessionStorage.removeItem('webchicken_checkout_voucher')
    setVietQrModal({
      isOpen: false,
      orderCode: '',
      amountMinor: 0,
      orderSummary: null,
      countdown: 900,
      isCancelling: false,
    })
    navigate(PATHS.PAYMENT_RESULT, { replace: true })
  }

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
      toast.warning('Vui lòng chọn hoặc thiết lập địa chỉ nhận hàng trước khi tiến hành đặt hàng!')
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
        toast.error('Đặt hàng không thành công. Vui lòng thử lại sau!')
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

      // 1. If BANK_TRANSFER (VietQR), open interactive VietQR payment modal without clearing cart yet
      if (paymentMethod === 'BANK_TRANSFER') {
        setIsSubmitting(false)
        setVietQrModal({
          isOpen: true,
          orderCode: primaryOrderCode,
          amountMinor: grandTotalMinor,
          orderSummary,
          countdown: 900,
          isCancelling: false,
        })
        return
      }

      // 2. If VNPAY is selected, request VNPay gateway URL and back up pending items
      if (paymentMethod === 'VNPAY') {
        sessionStorage.setItem('webchicken_pending_qr_items', JSON.stringify(selectedItems))
        sessionStorage.setItem('webchicken_last_order', JSON.stringify(orderSummary))
        sessionStorage.removeItem('webchicken_checkout_voucher')
        const vnpayUrl = await paymentApi.createVNPayUrl(primaryOrderCode)
        if (vnpayUrl) {
          setIsSubmitting(false)
          window.location.href = vnpayUrl
          return
        }
      }

      // 3. COD payment: finalize immediately
      isOrderPlacedRef.current = true
      sessionStorage.setItem('webchicken_last_order', JSON.stringify(orderSummary))
      selectedItems.forEach((i) => removeItem(i.skuId))
      sessionStorage.removeItem('webchicken_checkout_voucher')

      setIsSubmitting(false)
      navigate(PATHS.PAYMENT_RESULT, { replace: true })
    } catch {
      setIsSubmitting(false)
      toast.error('Không thể hoàn tất đặt hàng. Vui lòng thử lại sau.')
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
                          src={resolveImageUrl(item.imageUrl)}
                          alt={item.name}
                          className="checkout-item-thumb"
                          onError={handleImageFallback}
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
                  {SHIPPING_METHODS.map((method) => {
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

      {/* Interactive VietQR Payment Modal */}
      {vietQrModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={handleCancelVietQr}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📲</span>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Quét Mã VietQR Thanh Toán
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                    Mở app Ngân hàng hoặc MoMo quét mã QR bên dưới
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelVietQr}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: 4,
                  borderRadius: 6,
                }}
                title="Đóng / Hủy quét mã"
              >
                <X size={20} />
              </button>
            </div>

            {/* Countdown notice */}
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef08a',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#854d0e',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} />
                <span>Thời gian giữ đơn để quét mã:</span>
              </div>
              <strong style={{ fontSize: 13, fontFamily: 'monospace' }}>
                {Math.floor(vietQrModal.countdown / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(vietQrModal.countdown % 60).toString().padStart(2, '0')}
              </strong>
            </div>

            {/* QR Code Image Container */}
            <div
              style={{
                textAlign: 'center',
                padding: 16,
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <img
                src={`https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${vietQrModal.amountMinor}&addInfo=${encodeURIComponent(
                  vietQrModal.orderCode
                )}&accountName=CHICKYMART`}
                alt="VietQR Code"
                style={{
                  width: 240,
                  height: 240,
                  objectFit: 'contain',
                  margin: '0 auto',
                  display: 'block',
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=CHICKYMART_PAYMENT_' + vietQrModal.orderCode
                }}
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                Mã đơn: <strong>{vietQrModal.orderCode}</strong> • MB Bank
              </div>
            </div>

            {/* Account Details Box */}
            <div
              style={{
                backgroundColor: '#f1f5f9',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 12.5,
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                <strong>MB Bank (Ngân Hàng Quân Đội)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>0901234567</strong>
                  <button
                    type="button"
                    onClick={() => handleCopyText('0901234567', 'stk')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', padding: 0 }}
                  >
                    {copiedField === 'stk' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                <strong>CHICKYMART CO LTD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Số tiền thanh toán:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ color: '#b45309', fontSize: 14 }}>{formatMoney(vietQrModal.amountMinor)}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopyText(vietQrModal.amountMinor.toString(), 'amount')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', padding: 0 }}
                  >
                    {copiedField === 'amount' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Nội dung chuyển khoản:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{vietQrModal.orderCode}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopyText(vietQrModal.orderCode, 'content')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', padding: 0 }}
                  >
                    {copiedField === 'content' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleCancelVietQr}
                disabled={vietQrModal.isCancelling}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {vietQrModal.isCancelling ? 'Đang hủy...' : 'Hủy thanh toán / Quay lại'}
              </button>
              <button
                type="button"
                onClick={handleConfirmVietQrPaid}
                style={{
                  flex: 1.2,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                }}
              >
                Tôi đã chuyển khoản xong
              </button>
            </div>
          </div>
        </div>
      )}
    </StorefrontLayout>
  )
}
