import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { formatMoney } from '../../shared/lib/formatMoney'
import { PATHS } from '../../app/router/paths'
import { orderApi } from '../../features/orders/api/orderApi'
import { cartStore } from '../../app/store/cartStore'

interface OrderItem {
  id?: string
  skuId?: string
  productId: string
  name: string
  skuName?: string
  priceMinor: number
  imageUrl?: string
  quantity: number
}

interface OrderData {
  orderCode: string
  createdAt?: string
  recipient?: {
    recipientName?: string
    phoneNumber?: string
    streetAddress?: string
    district?: string
    city?: string
  }
  shippingMethod?: {
    name?: string
    estimatedTime?: string
  }
  paymentMethod?: string
  items?: OrderItem[]
  merchandiseSubtotalMinor?: number
  shippingTotalMinor?: number
  voucherDiscountMinor?: number
  grandTotalMinor?: number
}

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [copied, setCopied] = useState(false)

  // VNPay return parameters
  const vnpResponseCode = searchParams.get('vnp_ResponseCode')
  const vnpTxnRef = searchParams.get('vnp_TxnRef')
  const vnpTransactionNo = searchParams.get('vnp_TransactionNo')
  const vnpBankCode = searchParams.get('vnp_BankCode')
  const vnpAmountStr = searchParams.get('vnp_Amount')
  const vnpPayDate = searchParams.get('vnp_PayDate')

  const isVNPayCallback = vnpResponseCode !== null
  const isVNPaySuccess = vnpResponseCode === '00'

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('webchicken_last_order')
      if (stored) {
        setOrder(JSON.parse(stored))
      }
    } catch {
      // Ignore
    }

    if (isVNPayCallback) {
      const codeToCancel = vnpTxnRef || (order && order.orderCode)
      if (!isVNPaySuccess) {
        // Khách hàng hủy quét mã QR hoặc giao dịch VNPay thất bại
        if (codeToCancel) {
          orderApi.cancelOrder(codeToCancel, `Khách hàng hủy quét mã QR VNPay (Mã phản hồi: ${vnpResponseCode})`).catch(() => {})
        }
        // Xóa lưu trữ đơn hàng chưa hoàn tất
        sessionStorage.removeItem('webchicken_last_order')
        // Khôi phục lại giỏ hàng nếu cần
        try {
          const pendingRaw = sessionStorage.getItem('webchicken_pending_qr_items')
          if (pendingRaw) {
            const items = JSON.parse(pendingRaw)
            if (Array.isArray(items)) {
              items.forEach((it: any) => cartStore.addItem(it))
            }
            sessionStorage.removeItem('webchicken_pending_qr_items')
          }
        } catch {}
      } else {
        // Thanh toán VNPay thành công: dọn dẹp các sản phẩm khỏi giỏ hàng
        try {
          const pendingRaw = sessionStorage.getItem('webchicken_pending_qr_items')
          if (pendingRaw) {
            const items = JSON.parse(pendingRaw)
            if (Array.isArray(items)) {
              items.forEach((it: any) => cartStore.removeItem(it.skuId))
            }
            sessionStorage.removeItem('webchicken_pending_qr_items')
          }
        } catch {}

        // Tải thông tin đơn hàng thật từ server nếu sessionStorage rỗng
        if (vnpTxnRef) {
          orderApi.getOrderByCode(vnpTxnRef).then((backendOrder) => {
            if (backendOrder) {
              setOrder({
                orderCode: backendOrder.orderCode,
                createdAt: backendOrder.orderDate,
                recipient: {
                  recipientName: backendOrder.recipientName,
                  phoneNumber: backendOrder.recipientPhone,
                  streetAddress: backendOrder.shippingAddress,
                },
                shippingMethod: {
                  name: 'Tiêu chuẩn',
                  estimatedTime: '1 - 2 ngày làm việc',
                },
                paymentMethod: backendOrder.paymentMethod || 'VNPAY',
                items: backendOrder.items?.map((it: any) => ({
                  productId: it.productId,
                  name: it.productName,
                  skuName: it.skuName || it.variantName,
                  priceMinor: it.unitPriceAtPurchaseMinor || it.unitPriceMinor || it.priceMinor || 0,
                  imageUrl: it.imageUrl,
                  quantity: it.quantity,
                })),
                grandTotalMinor: backendOrder.totalAmountMinor,
              })
            }
          }).catch(() => {})
        }
      }
    }
  }, [isVNPayCallback, isVNPaySuccess, vnpTxnRef, vnpResponseCode])

  const displayOrderCode = vnpTxnRef || order?.orderCode || 'N/A'
  const displayAmountMinor = vnpAmountStr
    ? Math.floor(Number(vnpAmountStr) / 100)
    : (order?.grandTotalMinor || 0)

  const handleCopyCode = () => {
    if (displayOrderCode !== 'N/A') {
      navigator.clipboard.writeText(displayOrderCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const paymentMethodLabel = isVNPayCallback
    ? 'VNPAY-QR / Online Payment (Sandbox)'
    : {
        COD: 'Cash on Delivery (COD)',
        BANK_TRANSFER: 'VietQR / Instant Bank Transfer',
        VNPAY: 'VNPAY-QR / Online Payment (Sandbox)',
        BANKING: 'VietQR / Bank Transfer',
      }[order?.paymentMethod || 'COD'] || (order?.paymentMethod || 'COD')

  return (
    <StorefrontLayout>
      <div className="checkout-page-container">
        <div className="result-card print-target">
          {/* Header Status */}
          {isVNPayCallback && !isVNPaySuccess ? (
            <div className="result-header-section failed">
              <div className="result-icon-wrapper danger">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <span className="result-badge danger">Chưa hoàn tất thanh toán</span>
              <h1 className="result-title">Giao dịch quét mã QR chưa hoàn tất</h1>
              <p className="result-desc">
                Bạn chưa quét mã QR hoặc giao dịch đã bị hủy (Mã phản hồi: {vnpResponseCode}). Hệ thống <strong>KHÔNG</strong> tính là đã mua đơn hàng này. Sản phẩm vẫn được lưu giữ an toàn trong giỏ hàng của bạn.
              </p>
            </div>
          ) : (
            <div className="result-header-section success">
              <div className="result-icon-wrapper success">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <span className="result-badge success">
                {isVNPayCallback ? 'Payment Verified (PAID)' : 'Order Confirmed (COD)'}
              </span>
              <h1 className="result-title">
                {isVNPayCallback ? 'Thank You For Your Payment!' : 'Thank You For Your Order!'}
              </h1>
              <p className="result-desc">
                Đơn hàng của bạn đã được ghi nhận trên hệ thống sàn. Người bán đang chuẩn bị và đóng gói sản phẩm để bàn giao cho đơn vị vận chuyển.
              </p>
            </div>
          )}

          {/* Order Stepper (Shown when successful) */}
          {(!isVNPayCallback || isVNPaySuccess) && (
            <div className="result-stepper">
              <div className="result-step completed">
                <div className="result-step-circle">✓</div>
                <div className="result-step-title">Order Placed</div>
              </div>
              <div className="result-step-line completed" />
              <div className="result-step completed">
                <div className="result-step-circle">✓</div>
                <div className="result-step-title">{isVNPaySuccess ? 'Paid Online' : 'Confirmed COD'}</div>
              </div>
              <div className="result-step-line active" />
              <div className="result-step active">
                <div className="result-step-circle">3</div>
                <div className="result-step-title">Processing</div>
              </div>
              <div className="result-step-line" />
              <div className="result-step">
                <div className="result-step-circle">4</div>
                <div className="result-step-title">Delivered</div>
              </div>
            </div>
          )}

          {/* Receipt Details Box */}
          <div className="result-order-box">
            <div className="result-box-header">
              <h3>Order Receipt & Summary</h3>
              <button type="button" onClick={handlePrint} className="result-print-btn no-print">
                🖨️ Print Receipt
              </button>
            </div>

            <div className="result-order-row">
              <span>Order Reference Number</span>
              <div className="result-code-group">
                <span className="result-order-code">{displayOrderCode}</span>
                {displayOrderCode !== 'N/A' && (
                  <button type="button" onClick={handleCopyCode} className="result-copy-btn no-print">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {isVNPayCallback && (
              <>
                <div className="result-order-row">
                  <span>VNPay Transaction ID</span>
                  <span className="result-mono-text">{vnpTransactionNo || 'N/A'}</span>
                </div>

                {vnpBankCode && (
                  <div className="result-order-row">
                    <span>Partner Bank / Gateway</span>
                    <span style={{ fontWeight: 600 }}>{vnpBankCode}</span>
                  </div>
                )}

                <div className="result-order-row">
                  <span>Payment Gateway Status</span>
                  <span style={{ fontWeight: 700, color: isVNPaySuccess ? '#15803d' : '#b91c1c' }}>
                    {isVNPaySuccess ? 'PAID (VERIFIED)' : `CANCELLED / FAILED (${vnpResponseCode})`}
                  </span>
                </div>

                {vnpPayDate && (
                  <div className="result-order-row">
                    <span>Payment Timestamp</span>
                    <span>
                      {vnpPayDate.length === 14
                        ? `${vnpPayDate.slice(0, 4)}-${vnpPayDate.slice(4, 6)}-${vnpPayDate.slice(6, 8)} ${vnpPayDate.slice(8, 10)}:${vnpPayDate.slice(10, 12)}:${vnpPayDate.slice(12, 14)}`
                        : vnpPayDate}
                    </span>
                  </div>
                )}
              </>
            )}

            {order?.recipient?.recipientName && (
              <div className="result-order-row">
                <span>Recipient Name</span>
                <span style={{ fontWeight: 600 }}>{order.recipient.recipientName}</span>
              </div>
            )}

            {order?.recipient?.phoneNumber && (
              <div className="result-order-row">
                <span>Contact Phone</span>
                <span>{order.recipient.phoneNumber}</span>
              </div>
            )}

            {order?.recipient?.streetAddress && (
              <div className="result-order-row">
                <span>Delivery Address</span>
                <span>
                  {order.recipient.streetAddress}
                  {order.recipient.district ? `, ${order.recipient.district}` : ''}
                  {order.recipient.city ? `, ${order.recipient.city}` : ''}
                </span>
              </div>
            )}

            {order?.shippingMethod?.name && (
              <div className="result-order-row">
                <span>Shipping Service</span>
                <span>
                  {order.shippingMethod.name}
                  {order.shippingMethod.estimatedTime ? ` (${order.shippingMethod.estimatedTime})` : ''}
                </span>
              </div>
            )}

            <div className="result-order-row">
              <span>Payment Method</span>
              <span>{paymentMethodLabel}</span>
            </div>

            {/* Itemized Products */}
            {order?.items && order.items.length > 0 && (
              <div className="result-items-list">
                <div className="result-items-header">Ordered Items ({order.items.length})</div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="result-item-row">
                    <div className="result-item-left">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="result-item-thumb" />}
                      <div>
                        <div className="result-item-name">{item.name}</div>
                        {item.skuName && <div className="result-item-sku">{item.skuName}</div>}
                        <div className="result-item-qty">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="result-item-price">{formatMoney(item.priceMinor * item.quantity)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="result-order-row highlight">
              <span>Total Payment Amount</span>
              <span className="result-total-amount">{formatMoney(displayAmountMinor)}</span>
            </div>
          </div>

          {/* Marketplace Buyer Protection Box */}
          <div className="result-guarantee-box">
            <div className="result-guarantee-icon">🛡️</div>
            <div>
              <div className="result-guarantee-title">Cam Kết Chính Hãng & Bảo Vệ Khách Hàng</div>
              <div className="result-guarantee-desc">
                Đơn hàng được bảo đảm 100% hàng chính hãng, hỗ trợ đồng kiểm khi nhận hàng và miễn phí đổi trả trong 7 ngày nếu có lỗi từ nhà sản xuất.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="result-actions no-print">
            {isVNPayCallback && !isVNPaySuccess ? (
              <>
                <Link to={PATHS.CART} className="result-btn-primary">
                  Quay lại Giỏ hàng & Tiếp tục mua
                </Link>
                <Link to={PATHS.HOME} className="result-btn-secondary">
                  Về Trang chủ
                </Link>
              </>
            ) : (
              <>
                <Link to={PATHS.ACCOUNT.ORDERS} className="result-btn-primary">
                  Track Order in Real-Time
                </Link>
                <Link to={PATHS.HOME} className="result-btn-secondary">
                  Continue Shopping
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}
