import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  ShieldCheck,
  Users,
  ScrollText,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  ChevronRight,
  Boxes,
  CheckCircle2,
} from 'lucide-react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { PATHS } from '../../app/router/paths'
import { adminShopApi } from '../../features/admin/api/adminShopApi'
import { adminProductApi } from '../../features/admin/api/adminProductApi'
import { fetchAdminUsers } from '../../features/admin/api/adminUserApi'
import { fetchAuditLogs } from '../../features/admin/api/adminAuditApi'
import type { SellerApplication } from '../../features/admin/types'

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [productsCount, setProductsCount] = useState<number>(0)
  const [pendingProductsCount, setPendingProductsCount] = useState<number>(0)
  const [usersCount, setUsersCount] = useState<number>(0)
  const [auditLogsCount, setAuditLogsCount] = useState<number>(0)

  useEffect(() => {
    let isMounted = true
    const loadDashboardData = async () => {
      try {
        const [apps, prods, pendingProds, users, logs] = await Promise.allSettled([
          adminShopApi.getApplications(),
          adminProductApi.getProducts({ size: 1 }),
          adminProductApi.getProducts({ status: 'PENDING_APPROVAL', size: 100 }),
          fetchAdminUsers({ size: 1 }),
          fetchAuditLogs({ size: 1 }),
        ])

        if (!isMounted) return

        if (apps.status === 'fulfilled') {
          setApplications(apps.value || [])
        }
        if (prods.status === 'fulfilled') {
          setProductsCount(prods.value.total || 0)
        }
        if (pendingProds.status === 'fulfilled') {
          setPendingProductsCount(pendingProds.value.items.length || 0)
        }
        if (users.status === 'fulfilled') {
          setUsersCount(users.value.total || 0)
        }
        if (logs.status === 'fulfilled') {
          setAuditLogsCount(logs.value.total || 0)
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu tổng quan admin từ CSDL:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      isMounted = false
    }
  }, [])

  const pendingShopsCount = applications.filter((a) => a.status === 'PENDING').length
  const activeShopsCount = applications.filter((a) => a.status === 'APPROVED').length
  const totalPendingActionCount = pendingShopsCount + pendingProductsCount

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
              Giám sát thời gian thực hoạt động giao dịch sàn, hồ sơ nhà bán hàng, phê duyệt sản phẩm và nhật ký kiểm toán bảo mật.
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
              <span>Hệ thống: Trực tuyến • CSDL MySQL 8</span>
            </span>
          </div>
        </div>

        {/* 2. Critical Action Alerts Banner */}
        {totalPendingActionCount > 0 ? (
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
                  {totalPendingActionCount} Mục Đang Chờ Ban Quản Trị Kiểm Duyệt
                </h3>
                <p style={{ fontSize: 13, color: '#b45309', margin: '3px 0 0' }}>
                  {pendingShopsCount} đơn đăng ký gian hàng & {pendingProductsCount} sản phẩm đang chờ duyệt tuân thủ chính sách sàn.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {pendingShopsCount > 0 && (
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
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} />
            <span style={{ fontSize: 13.5, color: '#334155', fontWeight: 500 }}>
              Hệ thống đã xử lý toàn bộ: Hiện không có hồ sơ gian hàng hoặc sản phẩm nào tồn đọng chờ duyệt.
            </span>
          </div>
        )}

        {/* 3. Platform Macro KPI Metrics Grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {/* Card 1: Platform Stores */}
          <div className="admin-card" style={{ borderTop: '3px solid #f59e0b', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Gian Hàng Người Bán
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
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : `${activeShopsCount} Gian Hàng`}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
              {pendingShopsCount} hồ sơ chờ duyệt • {activeShopsCount} đang hoạt động
            </div>
          </div>

          {/* Card 2: Live Catalog Items */}
          <div className="admin-card" style={{ borderTop: '3px solid #2563eb', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Sản Phẩm Trong CSDL
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
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : `${productsCount} Sản Phẩm`}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
              {pendingProductsCount} sản phẩm đang chờ duyệt kiểm chuẩn
            </div>
          </div>

          {/* Card 3: Registered Users */}
          <div className="admin-card" style={{ borderTop: '3px solid #7c3aed', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Người Dùng Hệ Thống
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
                <Users style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : `${usersCount} Tài Khoản`}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
              Bao gồm Khách hàng, Người bán và Quản trị viên
            </div>
          </div>

          {/* Card 4: Audit Logs Ledger */}
          <div className="admin-card" style={{ borderTop: '3px solid #10b981', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Nhật Ký Kiểm Toán (Audit)
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
                <ScrollText style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : `${auditLogsCount} Bản Ghi`}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#059669', fontWeight: 600 }}>
              Ghi vết mọi thao tác quản trị nhạy cảm
            </div>
          </div>
        </section>

        {/* 4. Quick Governance Navigation Grid */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Các Phân Hệ Quản Trị Hệ Thống
            </h2>
            <span style={{ fontSize: 13, color: '#64748b' }}>WebChicKen Governance</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                    SHOPS
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Hồ Sơ Đăng Ký Gian Hàng
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
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
                    CATALOG
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Kiểm Duyệt Sản Phẩm Sàn
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Kiểm tra tiêu chuẩn an toàn thực phẩm, mô tả, hình ảnh và kiểm duyệt mở bán sản phẩm trên sàn.
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
                    IDENTITY
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Quản Lý Tài Khoản & Khóa Vi Phạm
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Quản lý danh sách người dùng, phân cấp khách hàng, khóa tài khoản vi phạm chính sách và thu hồi phiên làm việc.
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
                <span>Quản Lý {usersCount} Người Dùng</span>
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
                    AUDIT
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>
                  Nhật Ký Kiểm Toán Bất Biến
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
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
