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

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addItem } = useCartStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

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
              <span className="pdp-rating-score">★ {product.rating}</span>
              <span>{product.ratingCount} Reviews</span>
              <span>•</span>
              <span>{product.soldCount} Sold</span>
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
    </StorefrontLayout>
  )
}
export default ProductDetailPage
