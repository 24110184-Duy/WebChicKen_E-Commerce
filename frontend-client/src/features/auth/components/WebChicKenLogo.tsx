import React from 'react'
import { Link } from 'react-router-dom'

interface WebChicKenLogoProps {
  size?: 'sm' | 'md' | 'lg'
  textColor?: string
}

export const WebChicKenLogo: React.FC<WebChicKenLogoProps> = ({ size = 'md', textColor = '#1e293b' }) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36
  const fontSize = size === 'sm' ? '18px' : size === 'lg' ? '28px' : '22px'

  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {/* Brand Mascot / Modern Chicken Emblem */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #ee4d2d 0%, #ff5722 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          boxShadow: '0 4px 10px rgba(238, 77, 45, 0.3)',
          flexShrink: 0,
        }}
      >
        <svg width={iconSize * 0.65} height={iconSize * 0.65} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized Modern Chicken & Cart Emblem */}
          <path
            d="M12 2C8.5 2 6 5 6 8.5C6 11.5 8 13.5 10 15L12 22L14 15C16 13.5 18 11.5 18 8.5C18 5 15.5 2 12 2Z"
            fill="white"
            opacity="0.95"
          />
          <circle cx="12" cy="7.5" r="2" fill="#ee4d2d" />
          <path d="M15 8L18 9L15 10" stroke="#ffb703" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize, fontWeight: 900, letterSpacing: '-0.5px', color: textColor }}>
            Web<span style={{ color: '#ee4d2d' }}>ChicKen</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
export default WebChicKenLogo
