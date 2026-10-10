import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  Ban,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import { sellerApi } from '../../features/seller/api/sellerApi'
import type { SellerDashboardStats } from '../../features/seller/api/sellerApi'
import { formatMoney } from '../../shared/lib/formatMoney'
import { PATHS } from '../../app/router/paths'

export const SellerDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<string>('7d')
  const [shopId, setShopId] = useState<string | null>(null)
  const [stats, setStats] = useState<SellerDashboardStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [chartMode, setChartMode] = useState<'REVENUE' | 'ORDERS'>('REVENUE')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadStats = useCallback(
    async (targetShopId: string, targetPeriod: string, isManualRefresh: boolean = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setErrorMsg(null)

      try {
        const data = await sellerApi.fetchDashboardStats(targetShopId, targetPeriod)
        setStats(data)
      } catch (err: any) {
        setErrorMsg(err.message || 'Không thể tải thống kê hiệu suất người bán')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  useEffect(() => {
    sellerApi.getMyStore().then((store) => {
      if (store) {
        setShopId(store.id)
        loadStats(store.id, period)
      } else {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (shopId) {
      loadStats(shopId, period)
    }
  }, [shopId, period, loadStats])

  // Chart scaling calculations
  const maxChartValue = useMemo(() => {
    if (!stats || !stats.dailyTrend.length) return 100
    if (chartMode === 'REVENUE') {
      const max = Math.max(...stats.dailyTrend.map((p) => p.revenueMinor))
      return max > 0 ? max : 1000000
    } else {
      const max = Math.max(...stats.dailyTrend.map((p) => p.orderCount))
      return max > 0 ? max : 10
    }
  }, [stats, chartMode])

  // Peak metrics
  const peakDay = useMemo(() => {
    if (!stats || !stats.dailyTrend.length) return null
    return [...stats.dailyTrend].sort((a, b) => b.revenueMinor - a.revenueMinor)[0]
  }, [stats])

  return (
    <SellerLayout>
      <div className="seller-dashboard-shell">
        {/* 1. Header Bar with Timeframe Switcher */}
        <header className="seller-dashboard-header">
          <div className="seller-dashboard-title-group">
            <h1>
              <span>🍗 Seller Performance & Analytics</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Live Escrow Sync
              </span>
            </h1>
            <p className="seller-dashboard-subtitle">
              Comprehensive product sales analytics, fulfillment funnels, revenue breakdown, and inventory intelligence.
            </p>
          </div>

          <div className="seller-dashboard-controls">
            {/* Period Switcher */}
            <div className="seller-period-tabs">
              <button
                type="button"
                className={`seller-period-tab ${period === '7d' ? 'active' : ''}`}
                onClick={() => setPeriod('7d')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`seller-period-tab ${period === '14d' ? 'active' : ''}`}
                onClick={() => setPeriod('14d')}
              >
                Last 14 Days
              </button>
              <button
                type="button"
                className={`seller-period-tab ${period === '30d' ? 'active' : ''}`}
                onClick={() => setPeriod('30d')}
              >
                Last 30 Days
              </button>
            </div>

            {/* Live Refresh Button */}
            <button
              type="button"
              className="seller-refresh-btn"
              onClick={() => shopId && loadStats(shopId, period, true)}
              disabled={refreshing || loading}
              title="Refresh sales data"
            >
              <RefreshCw
                style={{
                  width: 14,
                  height: 14,
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* 2. Loading / Error / Content */}
        {loading && !stats ? (
          <div className="seller-loading-state" style={{ minHeight: 360 }}>
            <div className="seller-spinner" />
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
              Synthesizing seller performance metrics & order ledgers...
            </span>
          </div>
        ) : errorMsg ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #fee2e2',
            }}
          >
            <AlertTriangle style={{ width: 44, height: 44, color: '#ef4444', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              Unable to Load Analytics
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{errorMsg}</p>
            <button
              type="button"
              className="seller-primary-btn"
              onClick={() => shopId && loadStats(shopId, period)}
              style={{ margin: '0 auto' }}
            >
              Retry Loading
            </button>
          </div>
        ) : stats ? (
          <>
            {/* 3. Top Financial & Operational KPI Cards */}
            <section className="seller-kpi-grid">
              {/* Card 1: Net Revenue */}
              <div className="seller-kpi-card" style={{ borderTop: '3px solid #10b981' }}>
                <div className="seller-kpi-card-header">
                  <span className="seller-kpi-label">Net Sales Revenue</span>
                  <div
                    className="seller-kpi-icon-badge"
                    style={{ backgroundColor: '#ecfdf5', color: '#059669' }}
                  >
                    <DollarSign style={{ width: 20, height: 20 }} />
                  </div>
                </div>
                <div className="seller-kpi-value">
                  {formatMoney(stats.revenue.netRevenueMinor)}
                </div>
                <div className="seller-kpi-footer">
                  <span
                    style={{
                      color: '#059669',
                      fontWeight: 700,
                      backgroundColor: '#d1fae5',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  >
                    95% Net
                  </span>
                  <span>Gross: {formatMoney(stats.revenue.totalRevenueMinor)}</span>
                </div>
              </div>

              {/* Card 2: Withdrawable Escrow Balance */}
              <div className="seller-kpi-card" style={{ borderTop: '3px solid #2563eb' }}>
                <div className="seller-kpi-card-header">
                  <span className="seller-kpi-label">Withdrawable Balance</span>
                  <div
                    className="seller-kpi-icon-badge"
                    style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                  >
                    <Wallet style={{ width: 20, height: 20 }} />
                  </div>
                </div>
                <div className="seller-kpi-value" style={{ color: '#1d4ed8' }}>
                  {formatMoney(stats.revenue.withdrawableBalanceMinor)}
                </div>
                <div className="seller-kpi-footer">
                  <span
                    style={{
                      color: '#2563eb',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 style={{ width: 13, height: 13 }} />
                    Delivered & Cleared
                  </span>
                </div>
              </div>

              {/* Card 3: Pending Escrow Settlement */}
              <div className="seller-kpi-card" style={{ borderTop: '3px solid #f59e0b' }}>
                <div className="seller-kpi-card-header">
                  <span className="seller-kpi-label">Pending Settlement</span>
                  <div
                    className="seller-kpi-icon-badge"
                    style={{ backgroundColor: '#fffbeb', color: '#d97706' }}
                  >
                    <Clock style={{ width: 20, height: 20 }} />
                  </div>
                </div>
                <div className="seller-kpi-value" style={{ color: '#b45309' }}>
                  {formatMoney(stats.revenue.pendingSettlementMinor)}
                </div>
                <div className="seller-kpi-footer">
                  <span>Held in escrow until delivery</span>
                </div>
              </div>

              {/* Card 4: Fulfillment Success Rate */}
              <div className="seller-kpi-card" style={{ borderTop: '3px solid #059669' }}>
                <div className="seller-kpi-card-header">
                  <span className="seller-kpi-label">Fulfillment Rate</span>
                  <div
                    className="seller-kpi-icon-badge"
                    style={{ backgroundColor: '#ecfdf5', color: '#059669' }}
                  >
                    <Award style={{ width: 20, height: 20 }} />
                  </div>
                </div>
                <div className="seller-kpi-value">
                  {stats.orders.fulfillmentRate}%
                </div>
                <div className="seller-kpi-footer">
                  <span
                    style={{
                      color: stats.orders.cancelledOrders === 0 ? '#059669' : '#d97706',
                      fontWeight: 600,
                    }}
                  >
                    {stats.orders.cancelledOrders} cancelled / {stats.orders.totalOrders} total
                  </span>
                </div>
              </div>

              {/* Card 5: Average Order Value */}
              <div className="seller-kpi-card" style={{ borderTop: '3px solid #7c3aed' }}>
                <div className="seller-kpi-card-header">
                  <span className="seller-kpi-label">Avg Order Value (AOV)</span>
                  <div
                    className="seller-kpi-icon-badge"
                    style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}
                  >
                    <TrendingUp style={{ width: 20, height: 20 }} />
                  </div>
                </div>
                <div className="seller-kpi-value">
                  {formatMoney(stats.orders.averageOrderValueMinor)}
                </div>
                <div className="seller-kpi-footer">
                  <span>Per successful basket</span>
                </div>
              </div>
            </section>

            {/* 4. Sales & Orders Trend Interactive Chart */}
            <section className="seller-chart-card">
              <div className="seller-chart-header">
                <div>
                  <h2 className="seller-chart-title">
                    <TrendingUp style={{ width: 18, height: 18, color: '#f59e0b' }} />
                    <span>Sales Performance & Volume Dynamics</span>
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                    Tracking daily gross revenue and successful order throughput.
                    {peakDay && peakDay.revenueMinor > 0 && (
                      <span style={{ marginLeft: 8, color: '#059669', fontWeight: 600 }}>
                        Peak day: {peakDay.label} ({formatMoney(peakDay.revenueMinor)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="seller-chart-mode-toggle">
                  <button
                    type="button"
                    className={`seller-chart-mode-btn ${chartMode === 'REVENUE' ? 'active' : ''}`}
                    onClick={() => setChartMode('REVENUE')}
                  >
                    Revenue (VND)
                  </button>
                  <button
                    type="button"
                    className={`seller-chart-mode-btn ${chartMode === 'ORDERS' ? 'active' : ''}`}
                    onClick={() => setChartMode('ORDERS')}
                  >
                    Orders Count
                  </button>
                </div>
              </div>

              {/* Column Chart Visualization */}
              <div className="seller-chart-body">
                {stats.dailyTrend.map((point, idx) => {
                  const val = chartMode === 'REVENUE' ? point.revenueMinor : point.orderCount
                  const heightPercent = maxChartValue > 0 ? Math.max(6, Math.round((val / maxChartValue) * 100)) : 6
                  const isHovered = hoveredIndex === idx

                  return (
                    <div
                      key={point.date}
                      className="seller-chart-column"
                      onMouseEnter={() => {
                        setHoveredIndex(idx)
                      }}
                      onMouseLeave={() => {
                        setHoveredIndex(null)
                      }}
                    >
                      {/* Floating Tooltip */}
                      {isHovered && (
                        <div className="seller-chart-tooltip">
                          <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>
                            {point.label} ({point.date})
                          </div>
                          <div>Revenue: <strong>{formatMoney(point.revenueMinor)}</strong></div>
                          <div>Total Orders: <strong>{point.orderCount}</strong></div>
                          {point.deliveredCount > 0 && (
                            <div style={{ color: '#34d399' }}>Delivered: {point.deliveredCount}</div>
                          )}
                        </div>
                      )}

                      {/* Bar Fill */}
                      <div
                        className="seller-chart-bar-fill"
                        style={{
                          height: `${heightPercent}%`,
                          background:
                            chartMode === 'REVENUE'
                              ? isHovered
                                ? 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)'
                                : 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                              : isHovered
                              ? 'linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%)'
                              : 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                          boxShadow: isHovered ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none',
                        }}
                      />

                      {/* Date Label */}
                      <span className="seller-chart-column-label">{point.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Chart Legend & Summary Ribbon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 16,
                  fontSize: 12.5,
                  color: '#64748b',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: '#f59e0b',
                        display: 'inline-block',
                      }}
                    />
                    <span>Gross Sales Revenue</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: '#3b82f6',
                        display: 'inline-block',
                      }}
                    />
                    <span>Order Volume Counts</span>
                  </div>
                </div>

                <div>
                  Period Orders: <strong style={{ color: '#0f172a' }}>{stats.orders.totalOrders}</strong> | Gross Total: <strong style={{ color: '#0f172a' }}>{formatMoney(stats.revenue.totalRevenueMinor)}</strong>
                </div>
              </div>
            </section>

            {/* 5. Order Fulfillment Funnel / Pipeline */}
            <section className="seller-pipeline-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Order Fulfillment Pipeline
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    Click any stage to filter active orders in Fulfillment Management.
                  </p>
                </div>
                <Link
                  to={PATHS.SELLER.ORDERS}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    color: '#f59e0b',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>Go to Orders</span>
                  <ChevronRight style={{ width: 15, height: 15 }} />
                </Link>
              </div>

              <div className="seller-pipeline-grid">
                {/* 1. Pending Action */}
                <Link
                  to={`${PATHS.SELLER.ORDERS}?status=PENDING`}
                  className="seller-pipeline-card"
                  style={{ borderLeft: '4px solid #f59e0b' }}
                >
                  <div className="seller-pipeline-header">
                    <span className="seller-pipeline-name">Pending Confirmation</span>
                    <Clock style={{ width: 17, height: 17, color: '#f59e0b' }} />
                  </div>
                  <div className="seller-pipeline-count" style={{ color: '#d97706' }}>
                    {stats.orders.pendingOrders}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#b45309', fontWeight: 600 }}>
                    Action Required
                  </span>
                </Link>

                {/* 2. Ready to Ship */}
                <Link
                  to={`${PATHS.SELLER.ORDERS}?status=CONFIRMED`}
                  className="seller-pipeline-card"
                  style={{ borderLeft: '4px solid #2563eb' }}
                >
                  <div className="seller-pipeline-header">
                    <span className="seller-pipeline-name">Ready to Ship</span>
                    <PackageCheck style={{ width: 17, height: 17, color: '#2563eb' }} />
                  </div>
                  <div className="seller-pipeline-count" style={{ color: '#1d4ed8' }}>
                    {stats.orders.confirmedOrders}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#2563eb', fontWeight: 600 }}>
                    Print label & pack
                  </span>
                </Link>

                {/* 3. In Transit */}
                <Link
                  to={`${PATHS.SELLER.ORDERS}?status=SHIPPING`}
                  className="seller-pipeline-card"
                  style={{ borderLeft: '4px solid #7c3aed' }}
                >
                  <div className="seller-pipeline-header">
                    <span className="seller-pipeline-name">In Transit (Shipping)</span>
                    <Truck style={{ width: 17, height: 17, color: '#7c3aed' }} />
                  </div>
                  <div className="seller-pipeline-count" style={{ color: '#6d28d9' }}>
                    {stats.orders.shippingOrders}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#7c3aed', fontWeight: 600 }}>
                    Cold-chain tracking active
                  </span>
                </Link>

                {/* 4. Delivered */}
                <Link
                  to={`${PATHS.SELLER.ORDERS}?status=DELIVERED`}
                  className="seller-pipeline-card"
                  style={{ borderLeft: '4px solid #10b981' }}
                >
                  <div className="seller-pipeline-header">
                    <span className="seller-pipeline-name">Delivered & Paid</span>
                    <CheckCircle2 style={{ width: 17, height: 17, color: '#10b981' }} />
                  </div>
                  <div className="seller-pipeline-count" style={{ color: '#047857' }}>
                    {stats.orders.deliveredOrders}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 600 }}>
                    Payout cleared
                  </span>
                </Link>

                {/* 5. Cancelled */}
                <Link
                  to={`${PATHS.SELLER.ORDERS}?status=CANCELLED`}
                  className="seller-pipeline-card"
                  style={{ borderLeft: '4px solid #ef4444' }}
                >
                  <div className="seller-pipeline-header">
                    <span className="seller-pipeline-name">Cancelled / Returned</span>
                    <Ban style={{ width: 17, height: 17, color: '#ef4444' }} />
                  </div>
                  <div className="seller-pipeline-count" style={{ color: '#b91c1c' }}>
                    {stats.orders.cancelledOrders}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 600 }}>
                    Refunded / void
                  </span>
                </Link>
              </div>
            </section>

            {/* 6. Inventory Health & Low Stock Warning */}
            <section
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
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
                    backgroundColor: stats.inventory.lowStock > 0 || stats.inventory.outOfStock > 0 ? '#fffbeb' : '#ecfdf5',
                    color: stats.inventory.lowStock > 0 || stats.inventory.outOfStock > 0 ? '#d97706' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Boxes style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Inventory Health ({stats.inventory.totalUnitsInStock} total units across {stats.inventory.totalProducts} items)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12.5, flexWrap: 'wrap' }}>
                    <Link
                      to={`${PATHS.SELLER.PRODUCTS}?tab=ACTIVE`}
                      style={{
                        color: '#059669',
                        fontWeight: 600,
                        textDecoration: 'none',
                        backgroundColor: '#ecfdf5',
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #a7f3d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="View all healthy stock products"
                    >
                      <span>● {stats.inventory.healthyStock} Healthy Stock (&gt;15)</span>
                    </Link>
                    <Link
                      to={`${PATHS.SELLER.PRODUCTS}?tab=LOW_STOCK`}
                      style={{
                        color: '#b45309',
                        fontWeight: 700,
                        textDecoration: 'none',
                        backgroundColor: '#fffbeb',
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #fde68a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Click to view all low stock products (≤15 units)"
                    >
                      <span>⚠️ {stats.inventory.lowStock} Low Stock (≤15 units)</span>
                      <ArrowUpRight style={{ width: 13, height: 13 }} />
                    </Link>
                    <Link
                      to={`${PATHS.SELLER.PRODUCTS}?tab=OUT_OF_STOCK`}
                      style={{
                        color: '#b91c1c',
                        fontWeight: 700,
                        textDecoration: 'none',
                        backgroundColor: '#fef2f2',
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #fecaca',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Click to view all out of stock products"
                    >
                      <span>⛔ {stats.inventory.outOfStock} Out of Stock</span>
                      <ArrowUpRight style={{ width: 13, height: 13 }} />
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                to={`${PATHS.SELLER.PRODUCTS}?tab=LOW_STOCK`}
                className="seller-primary-btn"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '9px 16px',
                  borderRadius: 10,
                }}
              >
                <span>View Low Stock Products</span>
                <ArrowUpRight style={{ width: 14, height: 14 }} />
              </Link>
            </section>

            {/* 7. Bottom Two-Column Grid: Top Selling Products & Recent Orders */}
            <div className="seller-dashboard-two-col">
              {/* Left Column: Top Selling Products */}
              <div className="seller-dash-card">
                <div className="seller-dash-card-header">
                  <div className="seller-dash-card-title">
                    <Flame style={{ width: 18, height: 18, color: '#f59e0b' }} />
                    <span>Top-Selling Products</span>
                  </div>
                  <Link
                    to={PATHS.SELLER.PRODUCTS}
                    style={{ fontSize: 12.5, color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View Catalog
                  </Link>
                </div>

                <div>
                  {stats.topSellingProducts.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      No sales recorded in this timeframe.
                    </div>
                  ) : (
                    stats.topSellingProducts.map((p, idx) => (
                      <div key={p.productId || idx} className="seller-bestseller-row">
                        <div
                          className="seller-bestseller-rank"
                          style={{
                            backgroundColor: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : '#f8fafc',
                            color: idx === 0 ? '#b45309' : idx === 1 ? '#475569' : '#64748b',
                          }}
                        >
                          #{idx + 1}
                        </div>

                        <img
                          src={p.imageUrl}
                          alt={p.productName}
                          className="seller-bestseller-img"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop&q=60'
                          }}
                        />

                        <div className="seller-bestseller-info">
                          <div className="seller-bestseller-name" title={p.productName}>
                            {p.productName}
                          </div>
                          <div className="seller-bestseller-meta">{p.categoryName}</div>
                        </div>

                        <div className="seller-bestseller-sales">
                          <div className="seller-bestseller-units">{p.totalUnitsSold} sold</div>
                          <div className="seller-bestseller-revenue">
                            {formatMoney(p.totalRevenueMinor)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Recent Activity & Quick Fulfill */}
              <div className="seller-dash-card">
                <div className="seller-dash-card-header">
                  <div className="seller-dash-card-title">
                    <ShoppingBag style={{ width: 18, height: 18, color: '#2563eb' }} />
                    <span>Recent Incoming Orders</span>
                  </div>
                  <Link
                    to={PATHS.SELLER.ORDERS}
                    style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View All Orders
                  </Link>
                </div>

                <div>
                  {stats.recentOrders.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      No recent orders found.
                    </div>
                  ) : (
                    stats.recentOrders.map((ord) => {
                      const isPending = ord.status === 'PENDING'
                      const isConfirmed = ord.status === 'CONFIRMED'
                      const isShipping = ord.status === 'SHIPPING'
                      const isDelivered = ord.status === 'DELIVERED'

                      return (
                        <div key={ord.orderCode} className="seller-recent-order-item">
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                                {ord.orderCode}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  backgroundColor: isPending
                                    ? '#fffbeb'
                                    : isConfirmed
                                    ? '#eff6ff'
                                    : isShipping
                                    ? '#f5f3ff'
                                    : isDelivered
                                    ? '#ecfdf5'
                                    : '#fee2e2',
                                  color: isPending
                                    ? '#b45309'
                                    : isConfirmed
                                    ? '#1d4ed8'
                                    : isShipping
                                    ? '#6d28d9'
                                    : isDelivered
                                    ? '#047857'
                                    : '#b91c1c',
                                }}
                              >
                                {ord.status}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                              {ord.recipientName} • {ord.itemCount} items
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                              {formatMoney(ord.totalAmountMinor)}
                            </div>
                            <Link
                              to={`${PATHS.SELLER.ORDERS}?search=${ord.orderCode}`}
                              style={{
                                fontSize: 11.5,
                                color: '#f59e0b',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                marginTop: 2,
                              }}
                            >
                              <span>Manage</span>
                              <ChevronRight style={{ width: 12, height: 12 }} />
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SellerLayout>
  )
}

export default SellerDashboardPage
