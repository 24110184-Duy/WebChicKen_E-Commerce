import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { useCartStore } from '../../app/store/cartStore'
import type { CartItem } from '../../app/store/cartStore'
import { formatMoney } from '../../shared/lib/formatMoney'
import { Ticket } from 'lucide-react'
import { PATHS } from '../../app/router/paths'
import type { Voucher } from '../../features/cart/types/cartTypes'
import { VoucherModal } from '../../features/cart/components/VoucherModal'
import { toast } from '../../components/feedback/Toast'
import { ConfirmModal } from '../../components/feedback/ConfirmModal'

export const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    items,
    selectedItems,
    itemsByStore,
    totalQuantity,
    selectedQuantity,
    totalAmountMinor,
    syncWithBackend,
    updateQuantity,
    removeItem,
    toggleSelect,
    toggleSelectStore,
    toggleSelectAll,
  } = useCartStore()

  useEffect(() => {
    syncWithBackend()
  }, [])

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title?: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const isAllSelected = items.length > 0 && items.every((i) => i.selected)

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
  }

  // Calculate voucher discount
  let voucherDiscountMinor = 0
  if (appliedVoucher && selectedQuantity > 0) {
    if (appliedVoucher.discountType === 'AMOUNT') {
      voucherDiscountMinor = Math.min(appliedVoucher.discountValue, totalAmountMinor)
    } else {
      const pct = (totalAmountMinor * appliedVoucher.discountValue) / 100
      voucherDiscountMinor = Math.min(pct, appliedVoucher.maxDiscountMinor)
    }
  }

  const finalTotalMinor = Math.max(0, totalAmountMinor - voucherDiscountMinor)

  // Bulk remove selected
  const handleRemoveSelected = () => {
    if (selectedQuantity === 0) return
    setConfirmModal({
      isOpen: true,
      title: 'Xóa sản phẩm đã chọn',
      message: `Bạn có chắc chắn muốn xóa ${selectedQuantity} sản phẩm đã chọn khỏi giỏ hàng?`,
      onConfirm: () => {
        selectedItems.forEach((item) => removeItem(item.skuId))
        toast.success(`Đã xóa ${selectedQuantity} sản phẩm khỏi giỏ hàng.`)
      },
    })
  }

  const handleDeleteItem = (item: CartItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa sản phẩm',
      message: `Bạn có chắc chắn muốn xóa sản phẩm "${item.name}" khỏi giỏ hàng?`,
      onConfirm: () => {
        removeItem(item.skuId)
        toast.success('Đã xóa sản phẩm khỏi giỏ hàng.')
      },
    })
  }

  const handleProceedCheckout = () => {
    if (selectedQuantity === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 sản phẩm để tiến hành thanh toán.')
      return
    }

    const exceedingItem = selectedItems.find(
      (item) => typeof item.availableStock === 'number' && item.quantity > item.availableStock
    )
    if (exceedingItem) {
      toast.warning(
        `Sản phẩm "${exceedingItem.name}" vượt quá số lượng tồn kho khả dụng (${exceedingItem.availableStock}). Vui lòng điều chỉnh lại số lượng trước khi tiếp tục.`
      )
      return
    }

    // Persist applied voucher code in sessionStorage for checkout
    if (appliedVoucher) {
      sessionStorage.setItem('webchicken_checkout_voucher', JSON.stringify(appliedVoucher))
    } else {
      sessionStorage.removeItem('webchicken_checkout_voucher')
    }
    navigate(PATHS.CHECKOUT)
  }

  return (
    <StorefrontLayout>
      <div className="cart-page-container">
        {/* Breadcrumb */}
        <div className="cart-breadcrumb">
          <Link to={PATHS.HOME}>Home</Link>
          <span className="cart-breadcrumb-sep">/</span>
          <span className="cart-breadcrumb-current">Shopping Cart</span>
        </div>

        {/* Title */}
        <div className="cart-title-row">
          <h1 className="cart-main-title">Shopping Cart</h1>
          <span className="cart-item-count-badge">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in your cart
          </span>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="cart-empty-state">
            <div className="cart-empty-icon-box">0</div>
            <h2 className="cart-empty-title">Your shopping cart is empty</h2>
            <p className="cart-empty-desc">
              Khám phá hàng ngàn sản phẩm công nghệ, thời trang, đời sống và gia dụng chính hãng với ưu đãi tốt nhất.
            </p>
            <Link to={PATHS.SEARCH} className="cart-empty-btn">
              Khám Phá Sản Phẩm Ngay
            </Link>
          </div>
        ) : (
          /* Two Column Layout */
          <div className="cart-layout">
            {/* Left Column: Cart Items grouped by Store */}
            <div>
              {/* Header Bar */}
              <div className="cart-table-header">
                <div>
                  <input
                    type="checkbox"
                    className="cart-checkbox"
                    checked={isAllSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    title="Select all items"
                  />
                </div>
                <div>Product</div>
                <div style={{ textAlign: 'center' }}>Unit Price</div>
                <div style={{ textAlign: 'center' }}>Quantity</div>
                <div style={{ textAlign: 'right' }}>Total</div>
                <div style={{ textAlign: 'center' }}>Action</div>
              </div>

              {/* Grouped by Store */}
              {itemsByStore.map((storeGroup) => {
                const isStoreAllSelected = storeGroup.items.every((i) => i.selected)

                return (
                  <div key={storeGroup.storeId} className="cart-store-group">
                    {/* Store Title Bar */}
                    <div className="cart-store-header">
                      <input
                        type="checkbox"
                        className="cart-checkbox"
                        checked={isStoreAllSelected}
                        onChange={(e) => toggleSelectStore(storeGroup.storeId, e.target.checked)}
                        title={`Select all from ${storeGroup.storeName}`}
                      />
                      <span className="cart-store-tag">Shop Official</span>
                      <span className="cart-store-name">{storeGroup.storeName}</span>
                    </div>

                    {/* Store Items List */}
                    {storeGroup.items.map((item) => (
                      <div key={item.skuId} className="cart-item-row">
                        <div>
                          <input
                            type="checkbox"
                            className="cart-checkbox"
                            checked={item.selected}
                            onChange={() => toggleSelect(item.skuId)}
                            title="Select this item"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="cart-item-info">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="cart-item-img"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=150&q=80'
                            }}
                          />
                          <div className="cart-item-details">
                            <Link to={`/products/${item.productId}`} className="cart-item-title">
                              {item.name}
                            </Link>
                            {item.skuName && (
                              <span className="cart-item-sku-tag">
                                Variant: {item.skuName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'center' }} className="cart-item-price">
                          {formatMoney(item.priceMinor)}
                        </div>

                        {/* Quantity Stepper */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div className="cart-stepper">
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => updateQuantity(item.skuId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="cart-stepper-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => {
                                if (typeof item.availableStock === 'number' && item.quantity >= item.availableStock) {
                                  toast.warning(`Sản phẩm "${item.name}" chỉ còn tối đa ${item.availableStock} trong kho!`)
                                  return
                                }
                                updateQuantity(item.skuId, item.quantity + 1)
                              }}
                              disabled={typeof item.availableStock === 'number' && item.quantity >= item.availableStock}
                              aria-label="Increase quantity"
                              title={
                                typeof item.availableStock === 'number' && item.quantity >= item.availableStock
                                  ? `Số lượng đã đạt giới hạn tồn kho (${item.availableStock})`
                                  : 'Tăng số lượng'
                              }
                            >
                              +
                            </button>
                          </div>
                          {typeof item.availableStock === 'number' && (
                            <span
                              style={{
                                fontSize: 11,
                                color: item.quantity >= item.availableStock ? '#dc2626' : '#64748b',
                                fontWeight: item.quantity >= item.availableStock ? 700 : 500,
                              }}
                            >
                              {item.quantity >= item.availableStock
                                ? `Tối đa: ${item.availableStock}`
                                : `Còn ${item.availableStock} sản phẩm`}
                            </span>
                          )}
                        </div>

                        {/* Line Total */}
                        <div style={{ textAlign: 'right' }} className="cart-item-total">
                          {formatMoney(item.priceMinor * item.quantity)}
                        </div>

                        {/* Delete Action */}
                        <div style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="cart-delete-btn"
                            onClick={() => handleDeleteItem(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* Bottom Actions Toolbar */}
              <div className="cart-toolbar">
                <div className="cart-toolbar-left">
                  <label className="cart-toolbar-label">
                    <input
                      type="checkbox"
                      className="cart-checkbox"
                      checked={isAllSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                    <span>Select All ({totalQuantity})</span>
                  </label>
                  <button
                    type="button"
                    className="cart-bulk-delete-btn"
                    disabled={selectedQuantity === 0}
                    onClick={handleRemoveSelected}
                  >
                    Delete Selected ({selectedQuantity})
                  </button>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {selectedQuantity} of {totalQuantity} items selected
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Voucher */}
            <div>
              <div className="cart-summary-card">
                <h2 className="cart-summary-title">Order Summary</h2>

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

                {/* Subtotal */}
                <div className="cart-summary-row">
                  <span>Selected Subtotal ({selectedQuantity} items)</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {formatMoney(totalAmountMinor)}
                  </span>
                </div>

                {/* Voucher Discount */}
                {voucherDiscountMinor > 0 && (
                  <div className="cart-summary-row discount">
                    <span>Voucher Discount</span>
                    <span>- {formatMoney(voucherDiscountMinor)}</span>
                  </div>
                )}

                {/* Shipping Note */}
                <div className="cart-summary-row">
                  <span>Estimated Shipping</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Calculated at Checkout</span>
                </div>

                {/* Grand Total */}
                <div className="cart-summary-row total">
                  <span>Grand Total</span>
                  <span className="cart-summary-total-val">{formatMoney(finalTotalMinor)}</span>
                </div>

                {/* Checkout CTA Button */}
                <button
                  type="button"
                  className="cart-checkout-btn"
                  disabled={selectedQuantity === 0}
                  onClick={handleProceedCheckout}
                >
                  Proceed to Checkout ({selectedQuantity})
                </button>

                <span className="cart-guarantee-note">
                  Chính Hãng 100% & Thanh Toán An Toàn Bảo Đảm
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <VoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        orderValueMinor={totalAmountMinor}
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
      <ConfirmModal
        isOpen={Boolean(confirmModal?.isOpen)}
        title={confirmModal?.title}
        message={confirmModal?.message || ''}
        isDanger={true}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />
    </StorefrontLayout>
  )
}
