import React, { useState, useEffect } from 'react'
import { AccountLayout } from '../../../layouts/AccountLayout'
import { voucherApi } from '../../../features/cart/api/voucherApi'

interface VoucherItem {
  id: string
  code: string
  title: string
  type: 'SHIPPING' | 'DISCOUNT'
  discountText: string
  minSpend: string
  validUntil: string
  badgeText: string
}

export const VouchersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHICKYMART' | 'SHOP'>('ALL')
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    voucherApi.getAvailableVouchers().then(list => {
      if (list && list.length > 0) {
        setVouchers(list.map(v => ({
          id: v.id,
          code: v.code,
          title: v.title,
          type: (v.type === 'PERCENTAGE' ? 'DISCOUNT' : 'SHIPPING') as 'SHIPPING' | 'DISCOUNT',
          discountText: v.type === 'PERCENTAGE' ? `${v.discountValueMinor}% Off` : `${v.discountValueMinor.toLocaleString()} ₫ Off`,
          minSpend: `Min. Spend ${v.minOrderValueMinor.toLocaleString()} ₫`,
          validUntil: v.endDate ? v.endDate.slice(0, 10) : 'Permanent',
          badgeText: v.type === 'PERCENTAGE' ? 'Discount' : 'Shipping',
        })))
      }
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  return (
    <AccountLayout>
      <div style={{ background: '#ffffff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #efefef', marginBottom: 20 }}>
          {(['ALL', 'CHICKYMART', 'SHOP'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? '#b45309' : '#555',
                borderBottom: activeTab === tab ? '2px solid #eab308' : '2px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
              }}
            >
              {tab === 'ALL' ? `All (${vouchers.length})` : tab === 'CHICKYMART' ? `ChickyMart (${vouchers.length})` : 'Shop (0)'}
            </button>
          ))}
        </div>

        {/* Vouchers Grid */}
        {vouchers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {vouchers.map(v => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  border: '1px solid #fef3c7',
                  borderRadius: 4,
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {/* Left Badge */}
                <div
                  style={{
                    width: 110,
                    backgroundColor: v.type === 'SHIPPING' ? '#059669' : '#d97706',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
                    {v.badgeText}
                  </span>
                  <strong style={{ fontSize: 13, marginTop: 4, textAlign: 'center' }}>{v.type}</strong>
                </div>

                {/* Right Details */}
                <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{v.title}</div>
                    <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, marginTop: 2 }}>{v.discountText}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{v.minSpend}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>Exp: {v.validUntil}</span>
                    <span
                      style={{
                        padding: '4px 10px',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {v.code}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: '#64748b'
          }}>
            <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>
              {isLoading ? 'Đang tải danh sách ưu đãi...' : 'Hiện tại bạn chưa có mã ưu đãi nào khả dụng.'}
            </p>
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
