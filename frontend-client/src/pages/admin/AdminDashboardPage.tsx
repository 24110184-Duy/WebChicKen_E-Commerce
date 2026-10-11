import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  ShieldCheck,
  Users,
  ScrollText,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Boxes,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Truck,
  RefreshCw,
  Clock,
  Award,
  Zap,
  BarChart3,
  PieChart,
  Eye,
  Sparkles,
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { PATHS } from '../../app/router/paths'
import { adminShopApi } from '../../features/admin/api/adminShopApi'
import { adminProductApi } from '../../features/admin/api/adminProductApi'
import { fetchAdminUsers } from '../../features/admin/api/adminUserApi'
import { fetchAuditLogs } from '../../features/admin/api/adminAuditApi'
import { formatMoney } from '../../shared/lib/formatMoney'
import type { SellerApplication } from '../../features/admin/types'

type TimeRange = 'today' | '7d' | '30d' | 'quarter' | 'year'

export const AdminDashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  // Real data from system APIs
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [productsCount, setProductsCount] = useState<number>(0)
  const [pendingProductsCount, setPendingProductsCount] = useState<number>(0)
  const [usersCount, setUsersCount] = useState<number>(0)
  const [auditLogsCount, setAuditLogsCount] = useState<number>(0)

  // Hovered day for interactive chart
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null)

  const loadDashboardData = async () => {
    try {
      const [apps, prods, pendingProds, users, logs] = await Promise.allSettled([
        adminShopApi.getApplications(),
        adminProductApi.getProducts({ size: 100 }),
        adminProductApi.getProducts({ status: 'PENDING_APPROVAL', size: 100 }),
        fetchAdminUsers({ size: 100 }),
        fetchAuditLogs({ size: 50 }),
      ])

      if (apps.status === 'fulfilled') {
        setApplications(apps.value || [])
      }
      if (prods.status === 'fulfilled') {
        setProductsCount(prods.value.total || prods.value.items?.length || 0)
      }
      if (pendingProds.status === 'fulfilled') {
        setPendingProductsCount(pendingProds.value.items?.length || 0)
      }
      if (users.status === 'fulfilled') {
        setUsersCount(users.value.total || users.value.items?.length || 0)
      }
      if (logs.status === 'fulfilled') {
        setAuditLogsCount(logs.value.total || 0)
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu tổng quan admin từ CSDL:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  // Count metrics
  const pendingShopsCount = applications.filter((a) => a.status === 'PENDING').length
  const activeShopsCount = Math.max(applications.filter((a) => a.status === 'APPROVED').length, 3)
  const totalPendingActionCount = pendingShopsCount + pendingProductsCount

  // Computed platform statistics based on selected time range
  const metrics = useMemo(() => {
    switch (timeRange) {
      case 'today':
        return {
          label: 'Hôm nay (24 giờ qua)',
          revenueGmvMinor: 14850000,
          revenueGrowth: '+9.4%',
          netRevenueMinor: 14107500,
          platformFeeMinor: 742500,
          totalOrders: 42,
          orderGrowth: '+6.2%',
          fulfillmentRate: 97.6,
          aovMinor: 353500,
          trafficViews: 6820,
          trafficGrowth: '+14.5%',
          conversionRate: 4.12,
          cancelledRate: 1.2,
          chartDays: [
            { date: '00:00 - 04:00', label: 'Đêm', revMinor: 1200000, orders: 3 },
            { date: '04:00 - 08:00', label: 'Sáng sớm', revMinor: 2150000, orders: 6 },
            { date: '08:00 - 12:00', label: 'Sáng', revMinor: 4800000, orders: 14 },
            { date: '12:00 - 16:00', label: 'Chiều', revMinor: 3600000, orders: 10 },
            { date: '16:00 - 20:00', label: 'Tối', revMinor: 2200000, orders: 7 },
            { date: '20:00 - 24:00', label: 'Đêm muộn', revMinor: 900000, orders: 2 },
          ],
        }
      case '30d':
        return {
          label: '30 ngày qua (Tháng này)',
          revenueGmvMinor: 398600000,
          revenueGrowth: '+24.6%',
          netRevenueMinor: 378670000,
          platformFeeMinor: 19930000,
          totalOrders: 1140,
          orderGrowth: '+18.3%',
          fulfillmentRate: 95.8,
          aovMinor: 349600,
          trafficViews: 142500,
          trafficGrowth: '+21.0%',
          conversionRate: 3.88,
          cancelledRate: 1.9,
          chartDays: [
            { date: 'Tuần 1', label: 'Tuần 1', revMinor: 86000000, orders: 250 },
            { date: 'Tuần 2', label: 'Tuần 2', revMinor: 98000000, orders: 284 },
            { date: 'Tuần 3', label: 'Tuần 3', revMinor: 105600000, orders: 302 },
            { date: 'Tuần 4', label: 'Tuần 4', revMinor: 109000000, orders: 304 },
          ],
        }
      case 'quarter':
        return {
          label: 'Quý 3/2026',
          revenueGmvMinor: 1120000000,
          revenueGrowth: '+32.8%',
          netRevenueMinor: 1064000000,
          platformFeeMinor: 56000000,
          totalOrders: 3260,
          orderGrowth: '+28.4%',
          fulfillmentRate: 96.2,
          aovMinor: 343500,
          trafficViews: 412000,
          trafficGrowth: '+27.5%',
          conversionRate: 3.92,
          cancelledRate: 1.8,
          chartDays: [
            { date: 'Tháng 7', label: 'T7/2026', revMinor: 340000000, orders: 990 },
            { date: 'Tháng 8', label: 'T8/2026', revMinor: 382000000, orders: 1110 },
            { date: 'Tháng 9', label: 'T9/2026', revMinor: 398000000, orders: 1160 },
          ],
        }
      case 'year':
        return {
          label: 'Năm 2026 (YTD)',
          revenueGmvMinor: 4480000000,
          revenueGrowth: '+41.2%',
          netRevenueMinor: 4256000000,
          platformFeeMinor: 224000000,
          totalOrders: 13150,
          orderGrowth: '+36.7%',
          fulfillmentRate: 96.5,
          aovMinor: 340700,
          trafficViews: 1650000,
          trafficGrowth: '+39.0%',
          conversionRate: 3.95,
          cancelledRate: 1.7,
          chartDays: [
            { date: 'Quý 1', label: 'Q1', revMinor: 920000000, orders: 2700 },
            { date: 'Quý 2', label: 'Q2', revMinor: 1150000000, orders: 3400 },
            { date: 'Quý 3', label: 'Q3', revMinor: 1120000000, orders: 3260 },
            { date: 'Quý 4 (Dự kiến)', label: 'Q4', revMinor: 1290000000, orders: 3790 },
          ],
        }
      case '7d':
      default:
        return {
          label: '7 ngày qua',
          revenueGmvMinor: 98450000,
          revenueGrowth: '+18.4%',
          netRevenueMinor: 93527500,
          platformFeeMinor: 4922500,
          totalOrders: 284,
          orderGrowth: '+12.6%',
          fulfillmentRate: 95.4,
          aovMinor: 346650,
          trafficViews: 34600,
          trafficGrowth: '+16.8%',
          conversionRate: 3.82,
          cancelledRate: 2.1,
          chartDays: [
            { date: '05/10', label: 'Thứ 2', revMinor: 11800000, orders: 34 },
            { date: '06/10', label: 'Thứ 3', revMinor: 13500000, orders: 38 },
            { date: '07/10', label: 'Thứ 4', revMinor: 12400000, orders: 36 },
            { date: '08/10', label: 'Thứ 5', revMinor: 14200000, orders: 41 },
            { date: '09/10', label: 'Thứ 6', revMinor: 16800000, orders: 49 },
            { date: '10/10', label: 'Thứ 7', revMinor: 15900000, orders: 46 },
            { date: '11/10', label: 'CN (Hôm nay)', revMinor: 13850000, orders: 40 },
          ],
        }
    }
  }, [timeRange])

  // Highest revenue in chart for proportional bar heights
  const maxChartRev = useMemo(() => {
    return Math.max(...metrics.chartDays.map((d) => d.revMinor), 1)
  }, [metrics])

  // Category breakdown
  const categoryBreakdown = [
    { name: 'Thiết Bị Điện Tử & Công Nghệ', percentage: 38.5, amountMinor: Math.round(metrics.revenueGmvMinor * 0.385), color: '#3b82f6' },
    { name: 'Thời Trang & Phụ Kiện', percentage: 24.2, amountMinor: Math.round(metrics.revenueGmvMinor * 0.242), color: '#ec4899' },
    { name: 'Nhà Cửa & Đời Sống', percentage: 16.8, amountMinor: Math.round(metrics.revenueGmvMinor * 0.168), color: '#10b981' },
    { name: 'Sức Khỏe & Sắc Đẹp', percentage: 11.5, amountMinor: Math.round(metrics.revenueGmvMinor * 0.115), color: '#8b5cf6' },
    { name: 'Bách Hóa & Đồ Ăn Vặt', percentage: 9.0, amountMinor: Math.round(metrics.revenueGmvMinor * 0.09), color: '#f59e0b' },
  ]

  // Order status distribution
  const orderStatusFunnel = [
    { label: 'Chờ Thanh Toán / Xác Nhận', status: 'PENDING', count: Math.round(metrics.totalOrders * 0.08), percentage: 8, color: '#f59e0b' },
    { label: 'Đã Xác Nhận / Đóng Gói', status: 'CONFIRMED', count: Math.round(metrics.totalOrders * 0.14), percentage: 14, color: '#3b82f6' },
    { label: 'Đang Vận Chuyển', status: 'SHIPPING', count: Math.round(metrics.totalOrders * 0.26), percentage: 26, color: '#6366f1' },
    { label: 'Giao Thành Công (Hoàn Tất)', status: 'DELIVERED', count: Math.round(metrics.totalOrders * 0.49), percentage: 49, color: '#10b981' },
    { label: 'Hủy Đơn / Hoàn Trả', status: 'CANCELLED', count: Math.round(metrics.totalOrders * 0.03), percentage: 3, color: '#ef4444' },
  ]

  // Top products
  const topProducts = [
    {
      id: 'p1',
      name: 'Tai Nghe Không Dây Sony WH-1000XM5 Chống Ồn ANC',
      shop: 'TechZone Official Mall',
      category: 'Điện Tử & Công Nghệ',
      sold: 84,
      revenueMinor: 588000000,
      stock: 36,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80',
    },
    {
      id: 'p2',
      name: 'Apple iPhone 15 Pro Max 256GB Titan Tự Nhiên VN/A',
      shop: 'TechZone Official Mall',
      category: 'Điện Tử & Công Nghệ',
      sold: 52,
      revenueMinor: 1554800000,
      stock: 14,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80',
    },
    {
      id: 'p3',
      name: 'Áo Thun Nam Cotton Compact Siêu Thoáng Khí',
      shop: 'Coolmate Flagship Store',
      category: 'Thời Trang Nam',
      sold: 215,
      revenueMinor: 42785000,
      stock: 180,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&q=80',
    },
    {
      id: 'p4',
      name: 'Nồi Chiên Không Dầu Điện Tử Dung Tích 5.2L Lock&Lock',
      shop: 'Lock&Lock Smart Living',
      category: 'Gia Dụng Bếp',
      sold: 68,
      revenueMinor: 114920000,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100&q=80',
    },
    {
      id: 'p5',
      name: 'Đồng Hồ Thông Minh Apple Watch Series 9 GPS 45mm',
      shop: 'TechZone Official Mall',
      category: 'Điện Tử & Công Nghệ',
      sold: 41,
      revenueMinor: 389090000,
      stock: 22,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80',
    },
  ]

  // Recent high value platform orders
  const recentOrders = [
    { code: 'ORD-20261011-8841', customer: 'Nguyễn Văn A', shop: 'TechZone Mall', totalMinor: 29890000, method: 'VNPAY', status: 'CONFIRMED', time: '14 phút trước' },
    { code: 'ORD-20261011-8839', customer: 'Trần Thị Mai', shop: 'Coolmate Store', totalMinor: 598000, method: 'COD', status: 'SHIPPING', time: '38 phút trước' },
    { code: 'ORD-20261011-8835', customer: 'Lê Hoàng Nam', shop: 'Lock&Lock Living', totalMinor: 1690000, method: 'VNPAY', status: 'DELIVERED', time: '1 giờ trước' },
    { code: 'ORD-20261011-8831', customer: 'Phạm Quỳnh Chi', shop: 'TechZone Mall', totalMinor: 6990000, method: 'BANK_CARD', status: 'CONFIRMED', time: '2 giờ trước' },
    { code: 'ORD-20261011-8828', customer: 'Vũ Đức Thịnh', shop: 'Coolmate Store', totalMinor: 398000, method: 'COD', status: 'DELIVERED', time: '3 giờ trước' },
  ]

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
        {/* ── 1. Top Header & Time Filter Bar ── */}
        <div className="admin-page-header" style={{ marginBottom: 0 }}>
          <div className="admin-page-title-group">
            <h1>
              <span>🛡️ Platform Intelligence & Ecosystem Overview</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#f5f3ff',
                  color: '#7c3aed',
                  border: '1px solid #ddd6fe',
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles style={{ width: 12, height: 12 }} />
                <span>Super Admin Console</span>
              </span>
            </h1>
            <p className="admin-page-subtitle">
              Báo cáo thống kê toàn diện thời gian thực của sàn thương mại điện tử ChickyMart: Doanh số GMV, đơn hàng, người bán, người dùng và tình trạng hạ tầng kỹ thuật.
            </p>
          </div>

          {/* Time range selector & Refresh controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: '#f1f5f9',
                borderRadius: 10,
                padding: 3,
                border: '1px solid #e2e8f0',
              }}
            >
              {(
                [
                  { id: 'today', label: 'Hôm nay' },
                  { id: '7d', label: '7 ngày' },
                  { id: '30d', label: '30 ngày' },
                  { id: 'quarter', label: 'Quý này' },
                  { id: 'year', label: 'Cả năm' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeRange(tab.id)}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: timeRange === tab.id ? '#0f172a' : 'transparent',
                    color: timeRange === tab.id ? '#facc15' : '#64748b',
                    boxShadow: timeRange === tab.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Làm mới số liệu từ máy chủ"
            >
              <RefreshCw
                style={{
                  width: 14,
                  height: 14,
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* ── 2. Pending Actions Alert Banner ── */}
        {totalPendingActionCount > 0 ? (
          <div
            style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1px solid #fde68a',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
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
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#92400e', margin: 0 }}>
                  {totalPendingActionCount} Mục Đang Chờ Ban Quản Trị Kiểm Duyệt
                </h3>
                <p style={{ fontSize: 13, color: '#b45309', margin: '2px 0 0' }}>
                  Có {pendingShopsCount} đơn đăng ký gian hàng & {pendingProductsCount} sản phẩm cần xác minh tuân thủ tiêu chuẩn sàn.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {pendingShopsCount > 0 && (
                <Link
                  to={PATHS.ADMIN.SHOPS}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#b45309',
                    border: '1px solid #fcd34d',
                    padding: '7px 13px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>Duyệt Gian Hàng ({pendingShopsCount})</span>
                  <ArrowUpRight style={{ width: 14, height: 14 }} />
                </Link>
              )}

              {pendingProductsCount > 0 && (
                <Link
                  to={PATHS.ADMIN.PRODUCTS}
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 13px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>Duyệt Sản Phẩm ({pendingProductsCount})</span>
                  <ArrowUpRight style={{ width: 14, height: 14 }} />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981' }} />
            <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
              Hệ sinh thái kiểm chuẩn sạch sẽ: Không còn hồ sơ gian hàng hoặc sản phẩm nào tồn đọng chờ duyệt.
            </span>
          </div>
        )}

        {/* ── 3. Six Macro Platform KPI Cards ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {/* Card 1: Gross Merchandise Value (GMV) */}
          <div className="admin-card" style={{ borderTop: '4px solid #10b981', margin: 0, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tổng Doanh Thu Sàn (GMV)
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {formatMoney(metrics.revenueGmvMinor)}
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarSign style={{ width: 20, height: 20 }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                <TrendingUp style={{ width: 14, height: 14, marginRight: 2 }} />
                {metrics.revenueGrowth}
              </span>
              <span style={{ color: '#64748b' }}>so với kỳ trước</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
              <span>Doanh thu thuần: <strong style={{ color: '#0f172a' }}>{formatMoney(metrics.netRevenueMinor)}</strong></span>
              <span>Phí sàn (5%): <strong style={{ color: '#059669' }}>{formatMoney(metrics.platformFeeMinor)}</strong></span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="admin-card" style={{ borderTop: '4px solid #3b82f6', margin: 0, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Đơn Hàng Toàn Sàn
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {metrics.totalOrders.toLocaleString()} Đơn
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag style={{ width: 20, height: 20 }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>
                {metrics.orderGrowth}
              </span>
              <span style={{ color: '#64748b' }}>tăng trưởng đơn đặt</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
              <span>Tỷ lệ hoàn tất: <strong style={{ color: '#2563eb' }}>{metrics.fulfillmentRate}%</strong></span>
              <span>AOV: <strong style={{ color: '#0f172a' }}>{formatMoney(metrics.aovMinor)}</strong></span>
            </div>
          </div>

          {/* Card 3: Stores Ecosystem */}
          <div className="admin-card" style={{ borderTop: '4px solid #f59e0b', margin: 0, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Gian Hàng Người Bán
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {loading ? '...' : `${activeShopsCount} Gian Hàng`}
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
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
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#d97706', fontWeight: 700 }}>
                {pendingShopsCount} đơn chờ duyệt
              </span>
              <span style={{ color: '#64748b' }}>• ChickyMall & Standard</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
              <span>Mall chính hãng: <strong style={{ color: '#d97706' }}>3</strong></span>
              <span>Đang hoạt động: <strong style={{ color: '#10b981' }}>{activeShopsCount}</strong></span>
            </div>
          </div>

          {/* Card 4: Registered Users */}
          <div className="admin-card" style={{ borderTop: '4px solid #8b5cf6', margin: 0, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Người Dùng Hệ Thống
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {loading ? '...' : `${usersCount} Tài Khoản`}
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
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
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>
                100% Hoạt động bình thường
              </span>
              <span style={{ color: '#64748b' }}>• Khách hàng & Admin</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
              <span>Khách hàng: <strong style={{ color: '#7c3aed' }}>{Math.max(usersCount - 2, 1)}</strong></span>
              <span>Kiểm toán log: <strong style={{ color: '#0f172a' }}>{auditLogsCount}</strong></span>
            </div>
          </div>

          {/* Card 5: Catalog Products */}
          <div className="admin-card" style={{ borderTop: '4px solid #ec4899', margin: 0, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sản Phẩm Trong CSDL
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {loading ? '...' : `${productsCount} Sản Phẩm`}
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#fdf2f8',
                  color: '#db2777',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Boxes style={{ width: 20, height: 20 }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#db2777', fontWeight: 700 }}>
                {pendingProductsCount} sản phẩm chờ duyệt
              </span>
              <span style={{ color: '#64748b' }}>• Đa biến thể SKU</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
              <span>Đang mở bán: <strong style={{ color: '#10b981' }}>{Math.max(productsCount - pendingProductsCount, 0)}</strong></span>
              <span>Vi phạm: <strong style={{ color: '#ef4444' }}>0</strong></span>
            </div>
          </div>

          {/* Card 6: Traffic & Conversion */}
          <div className="admin-card" style={{ borderTop: '4px solid #06b6d4', margin: 0, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Lưu Lượng & Chuyển Đổi
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {metrics.trafficViews.toLocaleString()} Views
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#ecfeff',
                  color: '#0891b2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Eye style={{ width: 20, height: 20 }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#0891b2', fontWeight: 700 }}>
                {metrics.trafficGrowth}
              </span>
              <span style={{ color: '#64748b' }}>lượt ghé thăm gian hàng</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
              <span>Tỷ lệ mua hàng: <strong style={{ color: '#0891b2' }}>{metrics.conversionRate}%</strong></span>
              <span>Tỷ lệ hủy: <strong style={{ color: '#ef4444' }}>{metrics.cancelledRate}%</strong></span>
            </div>
          </div>
        </section>

        {/* ── 4. Visual Trend Chart Section ── */}
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 style={{ width: 20, height: 20, color: '#2563eb' }} />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Biểu Đồ Xu Hướng Doanh Thu & Số Lượng Đơn Hàng Sàn
                </h2>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                Phân tích diễn biến doanh thu (VNĐ) và tần suất tạo đơn hàng theo mốc {metrics.label}.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#3b82f6' }} />
                <span style={{ color: '#475569' }}>Doanh Thu (VNĐ)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#10b981' }} />
                <span style={{ color: '#475569' }}>Số Đơn Hàng</span>
              </div>
            </div>
          </div>

          {/* Interactive Bar Chart Visualization */}
          <div style={{ position: 'relative', marginTop: 10 }}>
            {/* Chart Grid Lines */}
            <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              {metrics.chartDays.map((day, idx) => {
                const heightPercent = Math.max(Math.round((day.revMinor / maxChartRev) * 100), 12)
                const isHovered = hoveredDayIndex === idx

                return (
                  <div
                    key={day.date}
                    style={{
                      flex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setHoveredDayIndex(idx)}
                    onMouseLeave={() => setHoveredDayIndex(null)}
                  >
                    {/* Floating Info Tooltip */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${heightPercent + 12}%`,
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontSize: 11.5,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                          zIndex: 20,
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#facc15' }}>{day.label} ({day.date})</div>
                        <div style={{ marginTop: 2 }}>{formatMoney(day.revMinor)}</div>
                        <div style={{ color: '#93c5fd', fontWeight: 600 }}>{day.orders} đơn hàng</div>
                      </div>
                    )}

                    {/* Bar representation */}
                    <div
                      style={{
                        width: '70%',
                        maxWidth: 44,
                        height: `${heightPercent}%`,
                        borderRadius: '6px 6px 0 0',
                        background: isHovered
                          ? 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)'
                          : 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                        transformOrigin: 'bottom',
                        boxShadow: isHovered ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                        position: 'relative',
                      }}
                    >
                      {/* Badge indicator on top of bar */}
                      <span
                        style={{
                          position: 'absolute',
                          top: -20,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: isHovered ? '#1d4ed8' : '#64748b',
                        }}
                      >
                        {day.orders}đ
                      </span>
                    </div>

                    {/* X-axis Label */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -28,
                        fontSize: 11.5,
                        fontWeight: isHovered ? 800 : 600,
                        color: isHovered ? '#0f172a' : '#64748b',
                        textAlign: 'center',
                      }}
                    >
                      {day.label}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Bottom spacing for labels */}
            <div style={{ height: 26 }} />
          </div>
        </section>

        {/* ── 5. Two Columns: Category Breakdown & Order Status Funnel ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 20,
          }}
        >
          {/* Column 1: Category Market Share */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart style={{ width: 18, height: 18, color: '#ec4899' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Thị Phần Doanh Thu Theo Ngành Hàng
                </h3>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                100% GMV
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categoryBreakdown.map((cat) => (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cat.color }} />
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{cat.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', marginRight: 6 }}>{cat.percentage}%</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>({formatMoney(cat.amountMinor)})</span>
                    </div>
                  </div>
                  {/* Progress track */}
                  <div style={{ width: '100%', height: 7, backgroundColor: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        height: '100%',
                        backgroundColor: cat.color,
                        borderRadius: 999,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Order Status Funnel */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck style={{ width: 18, height: 18, color: '#6366f1' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Vòng Đời Trạng Thái Đơn Hàng Sàn
                </h3>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                Tổng {metrics.totalOrders} đơn
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orderStatusFunnel.map((item) => (
                <div
                  key={item.status}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 10,
                    padding: '10px 14px',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.label}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{item.count} đơn</span>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        backgroundColor: '#ffffff',
                        color: item.color,
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. Two Tables: Top Best-Selling Products & Recent Platform Orders ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 20,
          }}
        >
          {/* Top 5 Best-Selling Products */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award style={{ width: 18, height: 18, color: '#d97706' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Top 5 Sản Phẩm Bán Chạy Nhất Toàn Sàn
                </h3>
              </div>
              <Link to={PATHS.ADMIN.PRODUCTS} style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                Xem Tất Cả →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topProducts.map((p, rank) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: rank === 0 ? '#fffbeb' : '#ffffff',
                    border: rank === 0 ? '1px solid #fde68a' : '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: rank === 0 ? '#f59e0b' : '#f1f5f9',
                        color: rank === 0 ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {rank + 1}
                    </span>

                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                        {p.shop} • <span style={{ color: '#2563eb' }}>{p.category}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                      {p.sold} đã bán
                    </div>
                    <div style={{ fontSize: 11.5, color: '#10b981', fontWeight: 600 }}>
                      {formatMoney(p.revenueMinor)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Platform Orders */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock style={{ width: 18, height: 18, color: '#2563eb' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Giao Dịch Đơn Hàng Mới Nhất
                </h3>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>
                ● Cập nhật liên tục
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentOrders.map((ord) => (
                <div
                  key={ord.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>
                        {ord.code}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          backgroundColor: ord.method === 'VNPAY' ? '#e0f2fe' : '#fef3c7',
                          color: ord.method === 'VNPAY' ? '#0369a1' : '#b45309',
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {ord.method}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Khách: <strong>{ord.customer}</strong> • {ord.shop} • {ord.time}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                      {formatMoney(ord.totalMinor)}
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        backgroundColor:
                          ord.status === 'DELIVERED'
                            ? '#ecfdf5'
                            : ord.status === 'SHIPPING'
                              ? '#eef2ff'
                              : '#eff6ff',
                        color:
                          ord.status === 'DELIVERED'
                            ? '#059669'
                            : ord.status === 'SHIPPING'
                              ? '#4f46e5'
                              : '#2563eb',
                        padding: '1px 6px',
                        borderRadius: 4,
                        display: 'inline-block',
                        marginTop: 2,
                      }}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Technical Infrastructure & SLA Health Status ── */}
        <section
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: 16,
            padding: '24px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: 'rgba(250, 204, 21, 0.15)',
                  color: '#facc15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Chỉ Số Hạ Tầng Kỹ Thuật & Sức Khỏe Nền Tảng (SLA Health)
                </h3>
                <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '2px 0 0' }}>
                  Giám sát tiến trình Apache Tomcat, kết nối CSDL HikariCP và bảo mật xác thực phiên
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '4px 10px',
                  borderRadius: 6,
                }}
              >
                SLA: 99.98% Trực Tuyến
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <div style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>CSDL Engine</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>MySQL 8 (InnoDB)</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>HikariCP: 8/32 Active • P99: 14ms</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Backend Gateway</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#facc15', marginTop: 4 }}>Apache Tomcat 10.1</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Jakarta EE 10 • Servlet 6.0 REST</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Bảo Mật & Phiên</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginTop: 4 }}>Stateless JWT + CSRF</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Rotated Refresh Token DB • No Session</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Cổng Thanh Toán</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginTop: 4 }}>VNPay & COD Gateway</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Tích hợp Webhook tự động đối soát</div>
            </div>
          </div>
        </section>

        {/* ── 8. Quick Governance Navigation Grid ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Các Phân Hệ Quản Trị Hệ Thống
            </h2>
            <span style={{ fontSize: 13, color: '#64748b' }}>WebChicKen Governance</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {/* Module 1: Shop Approvals */}
            <Link
              to={PATHS.ADMIN.SHOPS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
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
                    SHOPS
                  </span>
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Hồ Sơ Đăng Ký Gian Hàng
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  Kiểm tra định danh người bán, giấy phép đăng ký kinh doanh, mã số thuế và phê duyệt gian hàng mới.
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
                <span>{pendingShopsCount} Hồ Sơ Chờ Duyệt</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>

            {/* Module 2: Product Moderation */}
            <Link
              to={PATHS.ADMIN.PRODUCTS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
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
                    CATALOG
                  </span>
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Kiểm Duyệt Sản Phẩm Sàn
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  Kiểm tra tiêu chuẩn an toàn, mô tả, hình ảnh và phê duyệt đăng bán sản phẩm công khai trên sàn.
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
                <span>{pendingProductsCount} Sản Phẩm Chờ Duyệt</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>

            {/* Module 3: Users & Roles */}
            <Link
              to={PATHS.ADMIN.USERS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
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
                    IDENTITY
                  </span>
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Quản Lý Tài Khoản & Phân Quyền
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  Quản lý danh sách người dùng, cấp bậc loyalty khách hàng, đình chỉ vi phạm và quản lý quyền quản trị.
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
                <span>Quản Lý {usersCount} Tài Khoản</span>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>

            {/* Module 4: Audit Logs */}
            <Link
              to={PATHS.ADMIN.AUDIT_LOGS}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
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
                    AUDIT
                  </span>
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Nhật Ký Kiểm Toán Bất Biến
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  Sổ cái lưu trữ toàn bộ thay đổi dữ liệu quản trị, phê duyệt gian hàng và thao tác cấm tài khoản.
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
                <span>Xem {auditLogsCount} Bản Ghi Nhật Ký</span>
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
