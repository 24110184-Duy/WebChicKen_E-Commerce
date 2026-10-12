import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { catalogApi } from '../../features/catalog/api/catalogApi'
import type { Product, ProductVariant } from '../../features/catalog/types/catalogTypes'
import { useCartStore } from '../../app/store/cartStore'
import { useAuthStore } from '../../app/store/authStore'
import { formatMoney } from '../../shared/lib/formatMoney'
import { PATHS } from '../../app/router/paths'
import { ProductReviews } from '../../features/reviews/components/ProductReviews'
import { ProductShopCard } from '../../features/shop'
import { toast } from '../../components/feedback/Toast'
import { ShieldAlert, EyeOff, Eye } from 'lucide-react'
import { AdminProductActionModal } from '../../features/admin/components/AdminProductActionModal'

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin } = useAuthStore()
  const { addItem } = useCartStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdminActionModalOpen, setIsAdminActionModalOpen] = useState(false)
  const [isModeratedByAdmin, setIsModeratedByAdmin] = useState(false)
  const [moderationReason, setModerationReason] = useState('')

  const handleModerationSuccess = (action: 'HIDE' | 'DELETE' | 'UNHIDE', reason: string) => {
    if (action === 'DELETE') {
      setIsModeratedByAdmin(true)
      setModerationReason(reason)
      toast.success('Đã gỡ bỏ vĩnh viễn sản phẩm khỏi sàn!')
      setTimeout(() => {
        navigate(PATHS.HOME)
      }, 1200)
    } else if (action === 'UNHIDE') {
      setIsModeratedByAdmin(false)
      setModerationReason('')
      toast.success('Đã gỡ ẩn và mở bán lại sản phẩm trên sàn thành công!')
      if (product) {
        setProduct({ ...product, status: 'ACTIVE' })
      }
    } else {
      setIsModeratedByAdmin(true)
      setModerationReason(reason)
      toast.success('Đã tạm ẩn sản phẩm khỏi sàn thành công!')
      if (product) {
        setProduct({ ...product, status: 'INACTIVE' })
      }
    }
  }

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    catalogApi.getProductDetail(id).then(data => {
      if (data) {
        setProduct(data)
        setSelectedImage(data.imageUrls?.[0] || data.thumbnailUrl)
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
      }
      setIsLoading(false)
    })
  }, [id])

  const handleAddToCart = async () => {
    if (!product) return false

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!')
      navigate(PATHS.LOGIN, { state: { from: `/products/${product.id}` } })
      return false
    }

    const variant = selectedVariant || (product.variants && product.variants.length > 0 ? product.variants[0] : null)
    const skuId = variant?.id || product.id
    const skuName = variant?.attribute || 'Bản Tiêu Chuẩn'
    const priceMinor = variant?.basePriceMinor || product.minPriceMinor || 0
    const stock = variant?.stockQuantity ?? product.totalStock

    if (stock <= 0) {
      toast.warning('Sản phẩm này hiện đã hết hàng trong kho!')
      return false
    }

    await addItem({
      skuId,
      productId: product.id,
      name: variant ? `${product.name} (${skuName})` : product.name,
      skuName,
      priceMinor,
      imageUrl: selectedImage || product.thumbnailUrl || (product.imageUrls && product.imageUrls[0]) || '',
      quantity,
      availableStock: stock,
      storeId: product.storeId || 'store-1',
      storeName: product.storeName || 'Official Store',
    })

    toast.success(`Đã thêm ${quantity} x "${product.name}" vào giỏ hàng!`)
    return true
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để tiếp tục mua hàng!')
      navigate(PATHS.LOGIN, { state: { from: `/products/${product?.id || id}` } })
      return
    }
    const success = await handleAddToCart()
    if (success) {
      navigate(PATHS.CART)
    }
  }

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div style={{ maxWidth: 1240, margin: '60px auto', textAlign: 'center', color: '#64748b' }}>
          Loading product details...
        </div>
      </StorefrontLayout>
    )
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div style={{ maxWidth: 1240, margin: '60px auto', textAlign: 'center' }}>
          <h2>Product Not Found</h2>
          <p style={{ color: '#64748b', margin: '12px 0 24px' }}>The requested product does not exist or has been retired.</p>
          <Link to="/search" style={{ color: '#b45309', fontWeight: 700 }}>&larr; Back to Product Catalog</Link>
        </div>
      </StorefrontLayout>
    )
  }

  const currentPrice = selectedVariant ? selectedVariant.basePriceMinor : product.minPriceMinor

  return (
    <StorefrontLayout>
      <div className="pdp-page">
        {/* Breadcrumb */}
        <div className="plp-breadcrumbs">
          <Link to={PATHS.HOME}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link to={`/search?categoryId=${product.categoryId}`}>{product.categoryName}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Admin Quick Action Banner khi lướt sàn */}
        {isAdmin && (() => {
          const isInactive = product.status === 'INACTIVE' || isModeratedByAdmin
          return (
            <div
              style={{
                marginBottom: 18,
                padding: '14px 20px',
                backgroundColor: isInactive ? '#fef2f2' : '#fffbeb',
                border: isInactive ? '1px solid #fecaca' : '1px solid #fde68a',
                borderRadius: 12,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isInactive ? '#dc2626' : '#f59e0b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: isInactive ? '#991b1b' : '#92400e',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Quyền Hạn Quản Trị Viên: Kiểm Soát Sản Phẩm Trên Sàn
                  </span>
                  <p style={{ fontSize: 13, color: isInactive ? '#b91c1c' : '#78350f', margin: '2px 0 0' }}>
                    {isInactive ? (
                      <span style={{ fontWeight: 700 }}>
                        ⚠️ Sản phẩm này hiện đang bị TẠM ẨN khỏi sàn ({moderationReason || product.rejectionReason || 'Chỉ Quản trị viên mới thấy'}). Khách mua thông thường sẽ không nhìn thấy sản phẩm này.
                      </span>
                    ) : (
                      `Trạng thái: ${product.status} • Phát hiện sản phẩm không đạt chuẩn? Bạn có thể tạm ẩn hoặc gỡ bỏ ngay tại đây.`
                    )}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isInactive ? (
                  <button
                    type="button"
                    onClick={() => setIsAdminActionModalOpen(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #16a34a',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Eye size={15} />
                    <span>Gỡ Ẩn / Mở Bán Lại</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAdminActionModalOpen(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #d97706',
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <EyeOff size={15} />
                    <span>Tạm Ẩn / Gỡ Sản Phẩm</span>
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {/* Main PDP Card */}
        <div className="pdp-main-card">
          {/* Left: Gallery */}
          <div className="pdp-gallery">
            <div className="pdp-main-img-box">
              <img
                src={selectedImage}
                alt={product.name}
                className="pdp-main-img"
              />
            </div>

            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="pdp-thumb-row">
                {product.imageUrls.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`pdp-thumb-btn ${selectedImage === img ? 'active' : ''}`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Actions */}
          <div className="pdp-info">
            <div className="pdp-cat-tag">{product.categoryName}</div>
            <h1 className="pdp-title">{product.name}</h1>

            <div className="pdp-ratings-row">
              <span className="pdp-rating-score">
                ★ {product.ratingCount && product.ratingCount > 0 ? Number(product.rating || 5.0).toFixed(1) : '5.0'}
              </span>
              <span>{product.ratingCount && product.ratingCount > 0 ? `${product.ratingCount} Đánh giá` : 'Chưa có đánh giá'}</span>
              <span>•</span>
              <span>{product.soldCount && product.soldCount > 0 ? `${product.soldCount} Đã bán` : '0 Đã bán'}</span>
              <span>•</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>In Stock ({selectedVariant?.stockQuantity || product.totalStock})</span>
            </div>

            {/* Price Box */}
            <div className="pdp-price-box">
              <div className="pdp-price-val">
                {formatMoney(currentPrice)}
              </div>
              {product.discountPercent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 16 }}>
                    {formatMoney(Math.round(currentPrice * (1 + product.discountPercent / 100)))}
                  </span>
                  <span style={{ background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                    -{product.discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* SKU Variant Options */}
            {product.variants && product.variants.length > 0 && (
              <>
                <div className="pdp-section-label">Select Specification / Weight:</div>
                <div className="pdp-variants-list">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`pdp-variant-pill ${selectedVariant?.id === v.id ? 'active' : ''}`}
                    >
                      {v.attribute}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Quantity Selector */}
            <div className="pdp-qty-row">
              <div className="pdp-section-label" style={{ marginBottom: 0 }}>Quantity:</div>
              <div className="pdp-qty-counter">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="pdp-qty-btn"
                >
                  -
                </button>
                <div className="pdp-qty-val">{quantity}</div>
                <button
                  type="button"
                  disabled={quantity >= (selectedVariant?.stockQuantity || 99)}
                  onClick={() => setQuantity(q => q + 1)}
                  className="pdp-qty-btn"
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: 12, color: '#78716c' }}>
                {selectedVariant?.stockQuantity || product.totalStock} pieces available
              </span>
            </div>

            {/* Action Buttons */}
            {isModeratedByAdmin || product.status === 'INACTIVE' ? (
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  color: '#dc2626',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <EyeOff size={18} />
                <span>Sản phẩm này hiện đang tạm ẩn / dừng bán trên sàn.</span>
              </div>
            ) : (
              <div className="pdp-actions-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="pdp-btn-cart"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="pdp-btn-buy"
                >
                  Buy Now
                </button>
              </div>
            )}

            {/* Marketplace Guarantees */}
            <div style={{ marginTop: 28, padding: '16px', background: '#f8fafc', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                • 100% Genuine Guarantee: Cam kết hàng chính hãng, nguồn gốc xuất xứ rõ ràng.
              </div>
              <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                • Free Return: Đổi trả miễn phí trong vòng 7 ngày nếu phát sinh lỗi từ nhà sản xuất.
              </div>
              <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                • Fast & Secure Shipping: Đóng gói tiêu chuẩn sàn TMĐT, giao nhanh toàn quốc.
              </div>
            </div>
          </div>
        </div>

        {/* Shopee-style Shop Profile Card */}
        <ProductShopCard
          storeId={product.storeId}
          initialStoreName={product.storeName}
          productId={product.id}
          productName={product.name}
          productImage={selectedImage || product.thumbnailUrl}
          productPrice={currentPrice}
        />

        {/* Product Details & Specifications Tabs */}
        <div className="pdp-tabs-card">
          <div className="pdp-tab-header">Mô Tả Sản Phẩm & Thông Tin Chi Tiết</div>
          <div className="pdp-desc-text">
            <p style={{ marginBottom: 14 }}>{product.description}</p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '20px 0 10px' }}>Chính sách bán hàng & Hỗ trợ:</h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, color: '#475569', fontSize: 14 }}>
              <li>Sản phẩm được bảo hành chính hãng theo chính sách của thương hiệu và người bán.</li>
              <li>Hỗ trợ đồng kiểm khi nhận hàng, hoàn tiền 100% nếu phát hiện hàng giả, hàng nhái.</li>
              <li>Giao hàng nhanh 2H tại nội thành và giao tiết kiệm toàn quốc từ 2 - 4 ngày.</li>
              <li>Mọi thắc mắc vui lòng liên hệ trung tâm hỗ trợ khách hàng để được phục vụ 24/7.</li>
            </ul>
          </div>
        </div>

        {/* Customer Reviews & Feedback Section */}
        <ProductReviews productId={product.id} productTitle={product.name} />
      </div>

      {/* Modal can thiệp của Quản trị viên */}
      {isAdmin && product && (
        <AdminProductActionModal
          isOpen={isAdminActionModalOpen}
          productId={product.id}
          productName={product.name}
          productImage={selectedImage || product.thumbnailUrl}
          currentStatus={product.status}
          onClose={() => setIsAdminActionModalOpen(false)}
          onSuccess={handleModerationSuccess}
        />
      )}
    </StorefrontLayout>
  )
}
export default ProductDetailPage
