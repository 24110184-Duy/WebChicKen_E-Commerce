import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { ProductCard } from '../../components/molecules/ProductCard'
import { catalogApi } from '../../features/catalog/api/catalogApi'
import type { Category, Product } from '../../features/catalog/types/catalogTypes'

export const HomePage: React.FC = () => {
  // Hero Carousel state
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Flash sale countdown state
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 19 })

  // Dynamic products & categories from database
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      catalogApi.getCategories(),
      catalogApi.getProducts({ size: 20 })
    ]).then(([cats, prods]) => {
      setCategories(cats)
      setProducts(prods.items || [])
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3)
    }, 4500)
    return () => clearInterval(interval)
  }, [isPaused])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 6, minutes: 0, seconds: 0 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const flashProducts = products.filter(p => p.isFlashDeal)
  const recommendedProducts = products

  const format2Digits = (n: number) => String(n).padStart(2, '0')

  return (
    <StorefrontLayout>
      {/* 1. Hero Carousel */}
      <section className="storefront-hero">
        <div
          className="hero-slider-box"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Slide 1 */}
          <div className={`hero-slide hero-slide-1 ${currentSlide === 0 ? 'active' : ''}`}>
            <div className="hero-slide-content">
              <span className="hero-tag">Super Brand Day</span>
              <h1 className="hero-title">Siêu Sale Công Nghệ & Điện Tử Chính Hãng</h1>
              <p className="hero-desc">
                Khám phá flagship smartphone, laptop hiệu năng cao, phụ kiện âm thanh đỉnh cao với ưu đãi giảm đến 50% cùng voucher hoàn xu hấp dẫn.
              </p>
              <Link to="/search" className="hero-cta">
                Mua Ngay
              </Link>
            </div>
          </div>

          {/* Slide 2 */}
          <div className={`hero-slide hero-slide-2 ${currentSlide === 1 ? 'active' : ''}`}>
            <div className="hero-slide-content">
              <span className="hero-tag" style={{ background: '#f59e0b', color: '#0f172a' }}>Xu Hướng Mới</span>
              <h1 className="hero-title">Thời Trang & Phong Cách Sống Thời Thượng</h1>
              <p className="hero-desc">
                Bộ sưu tập trang phục xuân hè năng động, giày sneaker cá tính và phụ kiện sành điệu từ các thương hiệu thời trang dẫn đầu.
              </p>
              <Link to="/search" className="hero-cta">
                Khám Phá Ưu Đãi
              </Link>
            </div>
          </div>

          {/* Slide 3 */}
          <div className={`hero-slide hero-slide-3 ${currentSlide === 2 ? 'active' : ''}`}>
            <div className="hero-slide-content">
              <span className="hero-tag" style={{ background: '#22c55e', color: '#0f172a' }}>Giao Hỏa Tốc 2H</span>
              <h1 className="hero-title">Nhà Cửa & Đời Sống Tiện Nghi Thông Minh</h1>
              <p className="hero-desc">
                Nâng tầm không gian sống với đồ gia dụng thông minh, thiết bị nhà bếp cao cấp và nội thất tinh tế giao tận tay nhanh chóng.
              </p>
              <Link to="/search" className="hero-cta">
                Săn Voucher Freeship
              </Link>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="hero-dots">
            {[0, 1, 2].map(idx => (
              <button
                key={idx}
                type="button"
                className={`hero-dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Flash Deals Section */}
      {flashProducts.length > 0 && (
        <section className="flash-section">
          <div className="flash-header">
            <div className="flash-title-wrap">
              <span className="flash-badge">FLASH SALE</span>
              <span className="flash-title">Limited Time Daily Offers</span>
            </div>

            <div className="flash-timer">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginRight: 4 }}>Ending In:</span>
              <div className="flash-time-box">{format2Digits(timeLeft.hours)}</div>
              <span className="flash-time-colon">:</span>
              <div className="flash-time-box">{format2Digits(timeLeft.minutes)}</div>
              <span className="flash-time-colon">:</span>
              <div className="flash-time-box">{format2Digits(timeLeft.seconds)}</div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #fef3c7',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '24px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {flashProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Featured Categories Showcase */}
      {categories.length > 0 && (
        <section className="cat-grid-section">
          <div className="section-head">
            <h2 className="section-title">Explore by Category</h2>
            <Link to="/search" className="section-link">View All Categories &rarr;</Link>
          </div>

          <div className="cat-cards-grid">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/search?categoryId=${cat.id}`}
                className="cat-card-item"
              >
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '1.5px solid #fde68a',
                  color: '#92400e',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 900,
                }}>
                  {cat.name[0]}
                </div>
                <div className="cat-card-title">{cat.name}</div>
                <div className="cat-card-count">{cat.productCount || 0}+ Items</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. Daily Discover / Recommended Products */}
      <section style={{ maxWidth: 1240, margin: '40px auto 60px', padding: '0 20px' }}>
        <div className="section-head">
          <h2 className="section-title">Gợi Ý Hôm Nay (Daily Discover)</h2>
          <span style={{ fontSize: 13, color: '#78716c' }}>Sản phẩm thịnh hành, ưu đãi tốt nhất mỗi ngày</span>
        </div>

        {recommendedProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {recommendedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px dashed #e2e8f0',
            color: '#64748b'
          }}>
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
              {isLoading ? 'Đang tải danh sách sản phẩm...' : 'Chưa có sản phẩm nào được đăng tải.'}
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link
            to="/search"
            style={{
              display: 'inline-block',
              padding: '12px 36px',
              background: '#ffffff',
              border: '2px solid #eab308',
              color: '#92400e',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(234, 179, 8, 0.2)',
              transition: 'all 150ms ease',
            }}
          >
            Explore Full Product Catalog
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  )
}
