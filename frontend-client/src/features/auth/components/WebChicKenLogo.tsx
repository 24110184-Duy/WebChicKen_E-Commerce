import React from 'react'
import { Link } from 'react-router-dom'
import chickenMascotImg from '../../../assets/chicken-mascot.png'

interface WebChicKenLogoProps {
  size?: 'sm' | 'md' | 'lg'
  textColor?: string
}

export const WebChicKenLogo: React.FC<WebChicKenLogoProps> = ({ size = 'md', textColor = '#1e293b' }) => {
  const iconSize = size === 'sm' ? 36 : size === 'lg' ? 56 : 46
  const fontSize = size === 'sm' ? '18px' : size === 'lg' ? '28px' : '23px'

  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      {/* Authentic Chicken Mascot Avatar */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2.5px solid #facc15',
          boxShadow: '0 4px 14px rgba(202, 138, 4, 0.35)',
          backgroundColor: '#fef08a',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={chickenMascotImg}
          alt="WebChicKen Mascot"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15) translateY(2px)' }}
        />
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
