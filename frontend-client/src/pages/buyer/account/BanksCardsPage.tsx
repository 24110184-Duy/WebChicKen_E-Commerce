import React, { useState } from 'react'
import { AccountLayout } from '../../../layouts/AccountLayout'

export const BanksCardsPage: React.FC = () => {
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <AccountLayout>
      <div className="account-card" style={{ padding: '24px 30px' }}>
        {/* Credit / Debit Card Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid #efefef' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#333', margin: 0 }}>Credit / Debit Card</h2>
          </div>
          <button
            type="button"
            onClick={() => showToast('Add card feature is opening soon')}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
              color: '#0f172a',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(202, 138, 4, 0.25)',
            }}
          >
            + Add New Card
          </button>
        </div>

        <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(0,0,0,0.54)', fontSize: 14 }}>
          You don't have cards yet.
        </div>

        {/* My Bank Accounts Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 18px', borderTop: '1px solid #efefef', borderBottom: '1px solid #efefef' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#333', margin: 0 }}>My Bank Accounts</h2>
          </div>
          <button
            type="button"
            onClick={() => showToast('Add bank account feature is opening soon')}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
              color: '#0f172a',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(202, 138, 4, 0.25)',
            }}
          >
            + Add New Bank Account
          </button>
        </div>

        <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(0,0,0,0.54)', fontSize: 14 }}>
          You don't have bank accounts yet.
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
export default BanksCardsPage
