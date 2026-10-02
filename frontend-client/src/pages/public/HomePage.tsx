import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { ProductCard } from '../../components/molecules/ProductCard'
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../../features/catalog/api/catalogApi'

export const HomePage: React.FC = () => {
  // Hero Carousel state
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Flash sale countdown state (e.g. 5 hours 42 minutes 19 seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 19 })

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

  const flashProducts = MOCK_PRODUCTS.filter(p => p.isFlashDeal)
  const recommendedProducts = MOCK_PRODUCTS

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
              <span className="hero-tag">Certified Organic</span>
              <h1 className="hero-title">100% Free-Range & Pasture-Raised Poultry</h1>
              <p className="hero-desc">
                Naturally grain-fed chickens from trusted high-altitude farms. Free from antibiotics, hormones, and artificial preservatives.
              </p>
              <Link to="/search" className="hero-cta">
                Shop Fresh Chickens
              </Link>
            </div>
          </div>

          {/* Slide 2 */}
          <div className={`hero-slide hero-slide-2 ${currentSlide === 1 ? 'active' : ''}`}>
            <div className="hero-slide-content">
              <span className="hero-tag" style={{ background: '#f59e0b', color: '#0f172a' }}>Weekend Specials</span>
              <h1 className="hero-title">Chef-Crafted Marinades & Fresh Cuts Up to 20% Off</h1>
              <p className="hero-desc">
                Pre-marinated BBQ wings, herb-seasoned fillets, and crispy tenders ready to roast in under 15 minutes.
              </p>
              <Link to="/search?categoryId=cat-5" className="hero-cta">
                Explore Flash Deals
              </Link>
            </div>
          </div>

          {/* Slide 3 */}
          <div className={`hero-slide hero-slide-3 ${currentSlide === 2 ? 'active' : ''}`}>
            <div className="hero-slide-content">
              <span className="hero-tag" style={{ background: '#22c55e', color: '#0f172a' }}>Express Cold Delivery</span>
              <h1 className="hero-title">Farm-To-Door In Under 2 Hours</h1>
              <p className="hero-desc">
                Vacuum-packed fresh daily and shipped via temperature-controlled cold chain logistics for absolute freshness.
              </p>
              <Link to="/search" className="hero-cta">
                Order With Free Shipping
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

      {/* 3. Featured Categories Showcase */}
      <section className="cat-grid-section">
        <div className="section-head">
          <h2 className="section-title">Explore by Category</h2>
          <Link to="/search" className="section-link">View All Categories &rarr;</Link>
        </div>

        <div className="cat-cards-grid">
          {MOCK_CATEGORIES.map(cat => (
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
              <div className="cat-card-count">{cat.productCount || 10}+ Items</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Daily Discover / Recommended Products */}
      <section style={{ maxWidth: 1240, margin: '40px auto 60px', padding: '0 20px' }}>
        <div className="section-head">
          <h2 className="section-title">Daily Discover & Farm Favorites</h2>
          <span style={{ fontSize: 13, color: '#78716c' }}>Fresh selections updated daily</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {recommendedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

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
