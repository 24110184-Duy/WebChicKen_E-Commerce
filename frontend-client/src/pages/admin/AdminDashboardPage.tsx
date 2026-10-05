import React from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Store,
  ShieldCheck,
  Users,
  ScrollText,
  AlertTriangle,
  ArrowUpRight,
  ShoppingBag,
  Activity,
  ChevronRight,
  Boxes,
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { PATHS } from '../../app/router/paths'

export const AdminDashboardPage: React.FC = () => {
  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 1. Header Bar */}
        <div className="admin-page-header">
          <div className="admin-page-title-group">
            <h1>
              <span>🛡️ Platform Governance & Ecosystem Overview</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#f5f3ff',
                  color: '#7c3aed',
                  border: '1px solid #ddd6fe',
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                }}
              >
                Super Admin Console
              </span>
            </h1>
            <p className="admin-page-subtitle">
              Real-time surveillance of marketplace transactions, vendor compliance, product moderations, and security audit logs.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#ffffff',
                padding: '7px 14px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Activity style={{ width: 14, height: 14, color: '#10b981' }} />
              <span>Network: 128ms • Asia-East1</span>
            </span>
          </div>
        </div>

        {/* 2. Critical Action Alerts Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fde68a',
              }}
            >
              <AlertTriangle style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', margin: 0 }}>
                8 Pending Items Require Moderator Action
              </h3>
              <p style={{ fontSize: 13, color: '#b45309', margin: '3px 0 0' }}>
                3 new shop registration documents & 5 fresh poultry product listings are awaiting compliance review.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to={PATHS.ADMIN.SHOPS}
              style={{
                backgroundColor: '#ffffff',
                color: '#b45309',
                border: '1px solid #fcd34d',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Review Shops (3)</span>
              <ArrowUpRight style={{ width: 14, height: 14 }} />
            </Link>

            <Link
              to={PATHS.ADMIN.PRODUCTS}
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Moderate Products (5)</span>
              <ArrowUpRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>

        {/* 3. Platform Macro KPI Metrics Grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {/* Card 1: Platform GMV */}
          <div className="admin-card" style={{ borderTop: '3px solid #10b981', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Total Platform GMV
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>48.250.000 ₫</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#059669', fontWeight: 600 }}>
              +18.4% vs last cycle (5% Platform cut: 2.412.500 ₫)
            </div>
          </div>

          {/* Card 2: Merchant Stores */}
          <div className="admin-card" style={{ borderTop: '3px solid #f59e0b', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Merchant Stores
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Store style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>42 Stores</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
              3 pending verification • 39 fully active
            </div>
          </div>

          {/* Card 3: Live Poultry Products */}
          <div className="admin-card" style={{ borderTop: '3px solid #2563eb', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Live Catalog Items
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Boxes style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>1,280 Products</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
              5 items waiting for compliance review
            </div>
          </div>

          {/* Card 4: Orders & Ecosystem Health */}
          <div className="admin-card" style={{ borderTop: '3px solid #7c3aed', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Total Processed Orders
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#f5f3ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>3,850 Orders</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
              99.2% cold-chain fulfillment success rate
            </div>
          </div>
        </section>

        {/* 4. Quick Governance Navigation Grid */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Marketplace Governance Modules
            </h2>
            <span style={{ fontSize: 13, color: '#64748b' }}>WBS Phase 4 Backoffice Components</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {/* Module 1: TASK-64 Shop Approvals */}
            <Link
              to={PATHS.ADMIN.SHOPS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#fffbeb',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Store style={{ width: 20, height: 20 }} />
                  </div>
                  <span
                    style={{
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    TASK-64
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Shop Applications & Approvals
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Review seller identity, farm certification documents, tax code verifications, and approve/reject stores.
                </p>
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#d97706',
                }}
              >
                <span>3 Pending Applications</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>

            {/* Module 2: TASK-65 Product Moderation */}
            <Link
              to={PATHS.ADMIN.PRODUCTS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck style={{ width: 20, height: 20 }} />
                  </div>
                  <span
                    style={{
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    TASK-65
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Product Quality Moderation
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Review seller product listings, compliance with food safety standards, inspect ingredients, and approve/reject.
                </p>
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#2563eb',
                }}
              >
                <span>5 Pending Products</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>

            {/* Module 3: TASK-66 Users & Roles */}
            <Link
              to={PATHS.ADMIN.USERS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#f5f3ff',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users style={{ width: 20, height: 20 }} />
                  </div>
                  <span
                    style={{
                      backgroundColor: '#ede9fe',
                      color: '#6d28d9',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    TASK-66
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Users & Account Bans
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Manage platform users, customer loyalty tiers, lock violator accounts, and assign moderator administrative roles.
                </p>
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#7c3aed',
                }}
              >
                <span>Manage 1,420 Users</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>

            {/* Module 4: TASK-67 Audit Logs */}
            <Link
              to={PATHS.ADMIN.AUDIT_LOGS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ScrollText style={{ width: 20, height: 20 }} />
                  </div>
                  <span
                    style={{
                      backgroundColor: '#d1fae5',
                      color: '#047857',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    TASK-67
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Immutable Audit Trail
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Cryptographically traceable log recording all administrative modifications, shop verifications, and bans.
                </p>
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#059669',
                }}
              >
                <span>View Security Logs</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage
