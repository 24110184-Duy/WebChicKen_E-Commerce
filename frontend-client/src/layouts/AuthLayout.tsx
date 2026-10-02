import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Zap, ShieldCheck, Truck, HelpCircle } from 'lucide-react'
import { WebChicKenLogo } from '../features/auth/components/WebChicKenLogo'
import chickenMascotImg from '../assets/chicken-mascot.png'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3.5px solid #ffffff',
                  boxShadow: '0 8px 24px rgba(180, 83, 9, 0.25)',
                  backgroundColor: '#fef08a',
                  flexShrink: 0,
                }}
              >
                <img
                  src={chickenMascotImg}
                  alt="WebChicKen Mascot"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15) translateY(3px)' }}
                />
              </div>
              <div className="auth-hero-tag" style={{ margin: 0 }}>
                <span>🍗 ChickyMart Official Marketplace</span>
              </div>
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
            <a href="#about">About ChickyMart</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#shipping">Shipping Policy</a>
            <a href="#refund">Refund Policy</a>
            <Link to={PATHS.SELLER.REGISTER}>Seller Center</Link>
          </div>
          <div className="auth-footer-copy">
            <div>&copy; 2026 ChickyMart Vietnam Ltd. All rights reserved.</div>
            <div style={{ marginTop: '4px' }}>Hi-Tech Park, Thu Duc City, Ho Chi Minh City — Hotline: 1900 1234</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
export default AuthLayout
