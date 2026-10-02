import React, { useState } from 'react'
import { AccountLayout } from '../../../layouts/AccountLayout'

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

const MOCK_VOUCHERS: VoucherItem[] = [
  {
    id: 'v1',
    code: 'FREESHIP300',
    title: 'Shipping Voucher',
    type: 'SHIPPING',
    discountText: 'Shipping Fee up to 300k d',
    minSpend: 'Min. Spend 0 d',
    validUntil: '01.11.2026',
    badgeText: 'New User',
  },
  {
    id: 'v2',
    code: 'FREESHIP500',
    title: 'Shipping Voucher',
    type: 'SHIPPING',
    discountText: 'Shipping Fee up to 500k d',
    minSpend: 'Min. Spend 0 d',
    validUntil: '01.11.2026',
    badgeText: 'New User',
  },
  {
    id: 'v3',
    code: 'CHICKY30K',
    title: 'ChickyMart Discount',
    type: 'DISCOUNT',
    discountText: '30k d off',
    minSpend: 'Min. Spend 0 d',
    validUntil: '01.11.2026',
    badgeText: 'New User',
  },
  {
    id: 'v4',
    code: 'CHICKY50K',
    title: 'ChickyMart Discount',
    type: 'DISCOUNT',
    discountText: '50k d off',
    minSpend: 'Min. Spend 0 d',
    validUntil: '01.11.2026',
    badgeText: 'New User',
  },
]

export const VouchersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHICKYMART' | 'SHOP'>('ALL')
  const [voucherCode, setVoucherCode] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim()) {
      showToast('Please enter a voucher code')
      return
    }
    showToast(`Voucher code "${voucherCode}" applied successfully!`)
    setVoucherCode('')
  }

  return (
    <AccountLayout>
      <div className="account-card" style={{ padding: '24px 30px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid #efefef' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#333', margin: 0 }}>My Vouchers</h2>
          <div style={{ fontSize: 13, color: '#555' }}>
            <span style={{ cursor: 'pointer', color: '#b45309' }}>Get more vouchers</span>
            <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
            <span style={{ cursor: 'pointer' }}>View voucher history</span>
          </div>
        </div>

        {/* Add Voucher bar */}
        <form onSubmit={handleRedeem} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '24px 0', borderBottom: '1px solid #efefef', background: '#fafafa', borderRadius: 4, margin: '20px 0', paddingLeft: 20, paddingRight: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#555' }}>Add Voucher</label>
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder="Please enter voucher code"
            style={{
              flex: 1,
              maxWidth: 420,
              height: 38,
              border: '1px solid #e0e0e0',
              borderRadius: 4,
              padding: '0 12px',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              height: 38,
              padding: '0 24px',
              background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
              color: '#0f172a',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(202, 138, 4, 0.25)',
            }}
          >
            Redeem
          </button>
        </form>

        {/* Tabs */}
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
              {tab === 'ALL' ? 'All (4)' : tab === 'CHICKYMART' ? 'ChickyMart (4)' : 'Shop (0)'}
            </button>
          ))}
        </div>

        {/* Vouchers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {MOCK_VOUCHERS.map(v => (
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
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 2, marginBottom: 6 }}>
                  {v.badgeText}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase' }}>
                  {v.type === 'SHIPPING' ? 'FREE SHIP' : 'CHICKY'}
                </span>
                <span style={{ fontSize: 10, marginTop: 4, opacity: 0.9 }}>
                  {v.title}
                </span>
              </div>

              {/* Right Content */}
              <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{v.discountText}</div>
                  <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{v.minSpend}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Valid Till: {v.validUntil}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => showToast(`Voucher ${v.code} selected`)}
                    style={{
                      padding: '4px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      borderRadius: 4,
                      background: '#fefce8',
                      cursor: 'pointer',
                    }}
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="account-toast">
          {toast}
        </div>
      )}
    </AccountLayout>
  )
}
export default VouchersPage
