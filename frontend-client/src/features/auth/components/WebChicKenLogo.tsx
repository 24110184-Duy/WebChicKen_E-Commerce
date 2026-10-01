import React from 'react'
import { Link } from 'react-router-dom'

interface WebChicKenLogoProps {
  size?: 'sm' | 'md' | 'lg'
  textColor?: string
}

export const WebChicKenLogo: React.FC<WebChicKenLogoProps> = ({ size = 'md', textColor = '#1e293b' }) => {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40
  const fontSize = size === 'sm' ? '18px' : size === 'lg' ? '26px' : '22px'

  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {/* Cute & Modern Yellow Chicken Mascot SVG */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(234, 179, 8, 0.4)',
          flexShrink: 0,
        }}
      >
        <svg
          width={iconSize * 0.75}
          height={iconSize * 0.75}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Red Crest / Comb on Head */}
          <path
            d="M14 6C14 4.5 15.5 3 17 3C18.5 3 19 4.5 19 5.5C19.8 4.2 21.2 4 22 5C22.8 6 22.5 7.5 21.5 8.5C23 8.2 24.2 9 24 10.5C23.8 12 22 13 20 13L14 13C14 10 14 8 14 6Z"
            fill="#EF4444"
          />
          {/* Chicken Round Body */}
          <ellipse cx="18" cy="21" rx="13" ry="12" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.2" />
          {/* Cute Wing */}
          <path
            d="M9 19C9 19 12 16 16 18C16 22 13 25 10 24C8 23.3 8.5 20.5 9 19Z"
            fill="#FACC15"
            stroke="#CA8A04"
            strokeWidth="1"
          />
          {/* Big Sparkly Eye */}
          <circle cx="23" cy="17" r="2.8" fill="#1E293B" />
          <circle cx="24" cy="16" r="1" fill="#FFFFFF" />
          {/* Pink Cheek Blush */}
          <ellipse cx="20" cy="22" rx="2" ry="1.2" fill="#FCA5A5" opacity="0.8" />
          {/* Orange Beak */}
          <path
            d="M26 18L32 20.5L26 23Z"
            fill="#F97316"
            stroke="#EA580C"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          {/* Tiny Yellow Feet */}
          <path d="M15 32V35M15 35L13 36M15 35L17 36" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M21 32V35M21 35L19 36M21 35L23 36" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize, fontWeight: 900, letterSpacing: '-0.5px', color: textColor }}>
            Web<span style={{ color: '#d97706' }}>ChicKen</span>
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginLeft: '4px', textTransform: 'uppercase' }}>
            .vn
          </span>
        </div>
      </div>
    </Link>
  )
}
export default WebChicKenLogo
