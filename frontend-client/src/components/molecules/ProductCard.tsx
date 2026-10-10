import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../features/catalog/types/catalogTypes'
import { formatMoney } from '../../shared/lib/formatMoney'

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imgSrc, setImgSrc] = useState(product.thumbnailUrl)

  const handleImageError = () => {
    // Fallback image if remote url fails
    setImgSrc('https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80')
  }

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-img-wrap">
        <img
          src={imgSrc}
          alt={product.name}
          onError={handleImageError}
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
      </div>

      <div className="product-card-body">
        <div className="product-card-cat">{product.categoryName}</div>
        <h3 className="product-card-title">{product.name}</h3>

        <div className="product-card-meta">
          <span className="product-card-rating">★ {product.rating}</span>
          <span>({product.ratingCount})</span>
          <span>•</span>
          <span className="product-card-sold">{product.soldCount} sold</span>
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
  )
}
