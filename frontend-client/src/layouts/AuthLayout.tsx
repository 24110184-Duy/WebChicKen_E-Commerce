import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Zap, ShieldCheck, Truck, HelpCircle } from 'lucide-react'
import { WebChicKenLogo } from '../features/auth/components/WebChicKenLogo'
import { PATHS } from '../app/router/paths'

interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const location = useLocation()
  const isLogin = location.pathname === PATHS.LOGIN

  return (
    <div className="auth-page-wrapper">
      {/* 1. Clean Top Header */}
      <header className="auth-header">
        <div className="auth-header-container">
          <div className="auth-header-left">
            <WebChicKenLogo size="md" />
            <span className="auth-header-badge">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </span>
          </div>
          <a href="#help" className="auth-header-help" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={16} />
            Need help?
          </a>
        </div>
      </header>

      {/* 2. Hero Split Banner */}
      <section className="auth-hero-banner">
        <div className="auth-content-grid">
          {/* Left Column: Brand Showcase & Value Props */}
          <div className="auth-hero-left">
            <div className="auth-hero-tag">
              <span>🍗 WebChicKen E-Commerce Platform</span>
            </div>
            <h1 className="auth-hero-title">
              Effortless Shopping,
              <br />
              Ultra-Fast Delivery!
            </h1>
            <p className="auth-hero-subtitle">
              Experience the next-gen e-commerce marketplace. Thousands of exclusive deals, discount vouchers, and verified sellers await you.
            </p>

            <div className="auth-hero-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Zap size={20} />
                </div>
                <div>
                  <strong>Express 2-Hour Delivery</strong>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Same-day guaranteed arrival across metropolitan hubs</div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <strong>100% Authentic & Money-Back</strong>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Comprehensive buyer protection with automated escrow security</div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Truck size={20} />
                </div>
                <div>
                  <strong>Free Shipping Nationwide</strong>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Zero shipping fee vouchers available on all qualifying orders</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Auth Card */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {children}
          </div>
        </div>
      </section>

      {/* 3. Professional Marketplace Footer */}
      <footer className="auth-footer">
        <div className="auth-footer-container">
          <div className="auth-footer-links">
            <a href="#about">About WebChicKen</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#shipping">Shipping Policy</a>
            <a href="#refund">Refund Policy</a>
            <Link to={PATHS.SELLER.REGISTER}>Seller Center</Link>
          </div>
          <div className="auth-footer-copy">
            <div>&copy; 2026 WebChicKen Vietnam Ltd. All rights reserved.</div>
            <div style={{ marginTop: '4px' }}>Hi-Tech Park, Thu Duc City, Ho Chi Minh City — Hotline: 1900 1234</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
export default AuthLayout
