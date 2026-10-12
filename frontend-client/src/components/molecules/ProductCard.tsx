import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, EyeOff, Eye } from 'lucide-react'
import type { Product } from '../../features/catalog/types/catalogTypes'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useAuthStore } from '../../app/store/authStore'
import { AdminProductActionModal } from '../../features/admin/components/AdminProductActionModal'
import { resolveImageUrl, handleImageFallback } from '../../shared/utils/imageUrl'

interface ProductCardProps {
  product: Product
  onModerated?: (productId: string, action: 'HIDE' | 'DELETE' | 'UNHIDE') => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onModerated }) => {
  const { isAdmin } = useAuthStore()
  const [imgSrc, setImgSrc] = useState(() => resolveImageUrl(product.thumbnailUrl))

  React.useEffect(() => {
    setImgSrc(resolveImageUrl(product.thumbnailUrl))
  }, [product.thumbnailUrl])

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [isModerated, setIsModerated] = useState(false)
  const [moderatedAction, setModeratedAction] = useState<'HIDE' | 'DELETE' | 'UNHIDE' | null>(null)

  const isInactive = product.status === 'INACTIVE' || (isModerated && moderatedAction === 'HIDE')

  const handleModerationSuccess = (action: 'HIDE' | 'DELETE' | 'UNHIDE') => {
    if (action === 'UNHIDE') {
      setIsModerated(false)
      setModeratedAction(null)
      product.status = 'ACTIVE'
    } else {
      setIsModerated(true)
      setModeratedAction(action)
      if (action === 'HIDE') {
        product.status = 'INACTIVE'
      }
    }
    if (onModerated) {
      onModerated(product.id, action)
    }
  }

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Link to={`/products/${product.id}`} className="product-card" style={isModerated && moderatedAction === 'DELETE' ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
          <div className="product-card-img-wrap" style={{ position: 'relative' }}>
            <img
              src={imgSrc}
              alt={product.name}
              onError={handleImageFallback}
              loading="lazy"
              className="product-card-img"
            />

            {product.discountPercent && product.discountPercent > 0 && (
              <div className="product-badge-discount">
                -{product.discountPercent}%
              </div>
            )}

            {product.isFlashDeal && (
              <div className="product-badge-flash">
                Flash Deal
              </div>
            )}

            {/* Nút hành động nhanh của Quản Trị Viên khi lướt sàn */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsAdminModalOpen(true)
                }}
                title={
                  isInactive
                    ? 'Quản Trị Viên: Sản phẩm đang ẩn - Bấm để Gỡ ẩn hoặc Xóa'
                    : 'Quản Trị Viên: Tạm ẩn hoặc Gỡ bỏ sản phẩm vi phạm'
                }
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  backgroundColor: isInactive ? '#16a34a' : '#dc2626',
                  color: '#ffffff',
                  border: isInactive ? '1px solid #15803d' : '1px solid #b91c1c',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isInactive ? (
                  <>
                    <Eye style={{ width: 12, height: 12 }} />
                    <span>Bỏ Ẩn</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert style={{ width: 12, height: 12 }} />
                    <span>Ẩn / Gỡ</span>
                  </>
                )}
              </button>
            )}

            {/* Overlay hiển thị khi Admin vừa tạm ẩn / gỡ bỏ */}
            {isModerated && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  zIndex: 20,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  textAlign: 'center',
                  color: '#ffffff',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <EyeOff style={{ width: 28, height: 28, color: '#f87171', marginBottom: 6 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fecaca', textTransform: 'uppercase' }}>
                  {moderatedAction === 'DELETE' ? 'Đã gỡ khỏi sàn' : 'Đã tạm ẩn khỏi sàn'}
                </span>
                <span style={{ fontSize: 10.5, color: '#cbd5e1', marginTop: 2 }}>
                  Bởi Quản Trị Viên
                </span>
              </div>
            )}
          </div>

          <div className="product-card-body">
            <div className="product-card-cat">{product.categoryName}</div>
            <h3 className="product-card-title">{product.name}</h3>

            <div className="product-card-meta">
              {product.ratingCount && product.ratingCount > 0 ? (
                <>
                  <span className="product-card-rating">
                    ★ {Number(product.rating || 5.0).toFixed(1)}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>({product.ratingCount})</span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  ★ Chưa có đánh giá
                </span>
              )}
              <span>•</span>
              <span className="product-card-sold">
                {product.soldCount && product.soldCount > 0 ? `${product.soldCount} đã bán` : '0 đã bán'}
              </span>
            </div>

            <div className="product-card-price-row">
              <div className="product-card-price">
                {formatMoney(product.minPriceMinor)}
              </div>
              <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                Chính Hãng
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Modal can thiệp của Quản trị viên */}
      <AdminProductActionModal
        isOpen={isAdminModalOpen}
        productId={product.id}
        productName={product.name}
        productImage={imgSrc}
        currentStatus={isInactive ? 'INACTIVE' : product.status}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleModerationSuccess}
      />
    </>
  )
}
