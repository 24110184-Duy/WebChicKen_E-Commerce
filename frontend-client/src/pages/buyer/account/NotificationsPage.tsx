import React, { useState } from 'react'
import { AccountLayout } from '../../../layouts/AccountLayout'

export const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'UPDATES' | 'PROMOS'>('UPDATES')

  return (
    <AccountLayout>
      <div className="account-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #efefef', padding: '0 24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('UPDATES')}
            style={{
              padding: '16px 20px',
              fontSize: 14,
              fontWeight: activeTab === 'UPDATES' ? 700 : 400,
              color: activeTab === 'UPDATES' ? '#b45309' : '#555',
              borderBottom: activeTab === 'UPDATES' ? '2px solid #eab308' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Order Updates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PROMOS')}
            style={{
              padding: '16px 20px',
              fontSize: 14,
              fontWeight: activeTab === 'PROMOS' ? 700 : 400,
              color: activeTab === 'PROMOS' ? '#b45309' : '#555',
              borderBottom: activeTab === 'PROMOS' ? '2px solid #eab308' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Promotions
          </button>
        </div>

        <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
          <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.65)', marginBottom: 8 }}>No notifications yet</p>
          <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>Updates on orders and special promotions will appear here.</p>
        </div>
      </div>
    </AccountLayout>
  )
}
export default NotificationsPage
