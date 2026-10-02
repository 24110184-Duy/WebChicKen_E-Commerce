import React, { useState } from 'react'
import { AccountLayout } from '../../../layouts/AccountLayout'

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'TO_PAY' | 'TO_SHIP' | 'TO_RECEIVE' | 'COMPLETED' | 'CANCELLED'>('ALL')

  const TABS = [
    { key: 'ALL', label: 'All' },
    { key: 'TO_PAY', label: 'To Pay' },
    { key: 'TO_SHIP', label: 'To Ship' },
    { key: 'TO_RECEIVE', label: 'To Receive' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ] as const

  return (
    <AccountLayout>
      <div className="account-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Tabs Bar */}
        <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #efefef' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '16px 0',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? '#b45309' : '#555',
                borderBottom: activeTab === tab.key ? '2px solid #eab308' : '2px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
          <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.65)', marginBottom: 8 }}>No orders yet</p>
          <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>When you buy products, your purchase history will appear here.</p>
        </div>
      </div>
    </AccountLayout>
  )
}
export default OrdersPage
