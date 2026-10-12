import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import { sellerApi, type SellerDashboardStats } from '../../features/seller/api/sellerApi'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useAuthStore } from '../../app/store/authStore'
import { PATHS } from '../../app/router/paths'

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<SellerDashboardStats | null>(null)

  useEffect(() => {
    const resolveStore = async () => {
      let store = await sellerApi.getMyStore().catch(() => null)
      if (!store && user?.id) {
        const cached = localStorage.getItem(`seller_store_${user.id}`)
        if (cached) {
          try { store = JSON.parse(cached) } catch {}
        }
      }
      if (store?.id) {
        sellerApi.fetchDashboardStats(store.id, '7d').then((data) => {
          setStats(data)
        }).catch(() => {})
      }
    }
    resolveStore()
  }, [user?.id])

  const pendingShipment = stats?.orders.pendingOrders ?? 0
  const processedShipment = stats?.orders.confirmedOrders ?? 0
  const cancelledOrders = stats?.orders.cancelledOrders ?? 0
  const totalOrders = stats?.orders.totalOrders ?? 0
  const netRevenue = stats?.revenue.totalRevenueMinor ?? 0
  const visitors = totalOrders > 0 ? 4 : 0
  const pageViews = totalOrders > 0 ? 5 : 0
  const conversionRate = stats?.orders.fulfillmentRate ? `${stats.orders.fulfillmentRate}%` : '0.00%'

  return (
    <SellerLayout>
      <div style={{ padding: '20px 24px', backgroundColor: '#f6f6f6', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* ── LEFT MAIN COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. TO DO LIST (Ảnh 1) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 4,
                border: '1px solid #e8e8e8',
                padding: '20px 24px',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#262626', margin: '0 0 20px' }}>
                To Do List
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  textAlign: 'center',
                  gap: 12,
                }}
              >
                {/* To Process Shipment */}
                <Link
                  to={PATHS.SELLER.SHIPMENT}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
                    {pendingShipment}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#595959' }}>To Process Shipment</div>
                </Link>

                {/* Processed Shipment */}
                <Link
                  to={PATHS.SELLER.SHIPMENT}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
                    {processedShipment}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#595959' }}>Processed Shipment</div>
                </Link>

                {/* Return/Refund/Cancel */}
                <Link
                  to={`${PATHS.SELLER.ORDERS}?status=CANCELLED`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
                    {cancelledOrders}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#595959' }}>Return/Refund/Cancel</div>
                </Link>

                {/* Banned / Deboosted Products */}
                <Link
                  to={`${PATHS.SELLER.PRODUCTS}?tab=VIOLATION`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
                    0
                  </div>
                  <div style={{ fontSize: 12.5, color: '#595959' }}>Banned / Deboosted Products</div>
                </Link>
              </div>
            </div>

            {/* 2. BUSINESS INSIGHTS (Ảnh 1) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 4,
                border: '1px solid #e8e8e8',
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#262626', margin: 0 }}>
                    Business Insights
                  </h2>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    Real-time data until GMT+7 17:00 (Data changes is compared to yesterday)
                  </span>
                </div>
                <Link
                  to={PATHS.SELLER.ORDERS}
                  style={{
                    fontSize: 13,
                    color: '#2563eb',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    fontWeight: 600,
                  }}
                >
                  <span>More</span>
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 16,
                }}
              >
                {/* Sales */}
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Sales</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#262626' }}>
                    {formatMoney(netRevenue)}
                  </div>
                  <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>▲ +00</div>
                </div>

                {/* Visitors */}
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Visitors</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#262626' }}>{visitors}</div>
                  <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>▲ +00</div>
                </div>

                {/* Page Views */}
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Page Views</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#262626' }}>{pageViews}</div>
                  <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>▲ +00</div>
                </div>

                {/* Orders */}
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Orders</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#262626' }}>{totalOrders}</div>
                  <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>▲ +00</div>
                </div>

                {/* Conversion Rate */}
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Conversion Rate</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#262626' }}>{conversionRate}</div>
                  <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>▲ 0.00%</div>
                </div>
              </div>
            </div>

            {/* 3. SHOPEE ADS / CHICKYMART ADS (Ảnh 1) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 4,
                border: '1px solid #e8e8e8',
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#262626', margin: 0 }}>
                  ChickyMart Ads
                </h2>
                <Link
                  to={PATHS.SELLER.PRODUCTS}
                  style={{
                    fontSize: 13,
                    color: '#2563eb',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    fontWeight: 600,
                  }}
                >
                  <span>More</span>
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Promo Card 1 */}
                <div
                  style={{
                    border: '1px solid #fde047',
                    borderRadius: 6,
                    padding: '16px',
                    backgroundColor: '#fefce8',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, backgroundColor: '#facc15', color: '#0f172a', padding: '1px 6px', borderRadius: 3, fontWeight: 800 }}>
                        HOT
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#854d0e' }}>
                        Promote Potentials to Boost Traffic
                      </span>
                    </div>

                    {stats?.topSellingProducts && stats.topSellingProducts.length > 0 ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                          <img
                            src={stats.topSellingProducts[0].imageUrl || 'https://placehold.co/44x44'}
                            alt=""
                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>{stats.topSellingProducts[0].productName}</div>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>ID: {stats.topSellingProducts[0].productId?.slice(0, 8)}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                          Competitiveness +28% ▲
                        </div>
                      </div>
                    ) : (
                      <div style={{ margin: '14px 0 10px', fontSize: 12.5, color: '#713f12', lineHeight: 1.5 }}>
                        Chưa có sản phẩm tiềm năng. Hãy đăng bán sản phẩm đầu tiên để tối ưu hóa doanh thu gian hàng!
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 14, textAlign: 'right' }}>
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#fef9c3',
                        border: '1px solid #ca8a04',
                        color: '#854d0e',
                        padding: '5px 16px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Create Now
                    </button>
                  </div>
                </div>

                {/* Promo Card 2 */}
                <div
                  style={{
                    border: '1px solid #fef08a',
                    borderRadius: 6,
                    padding: '16px',
                    backgroundColor: '#fefce8',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e', marginBottom: 8 }}>
                      Maximise your sales with ChickyMart Ads!
                    </div>
                    <p style={{ fontSize: 12, color: '#713f12', margin: 0, lineHeight: 1.5 }}>
                      Learn more about ChickyMart Ads. Find the right way to advertise and make your Ads affordable.
                    </p>
                  </div>

                  <div style={{ marginTop: 14, textAlign: 'right' }}>
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #d9d9d9',
                        color: '#595959',
                        padding: '5px 16px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. LIVESTREAM & AFFILIATE (Ảnh 1) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  border: '1px solid #e8e8e8',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#262626', margin: 0 }}>
                    Affiliate Marketing Solution
                  </h3>
                  <span style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>More &gt;</span>
                </div>
                <p style={{ fontSize: 12, color: '#595959', margin: '4px 0 0' }}>
                  Only pay for successful orders brought by affiliates!
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  border: '1px solid #e8e8e8',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#262626', margin: 0 }}>
                    Livestream
                  </h3>
                  <span style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>More &gt;</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ca8a04' }}>Start streaming now!</div>
                <p style={{ fontSize: 12, color: '#595959', margin: '2px 0 0' }}>
                  Increase your conversion up to 2x!
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: SHOP PERFORMANCE & ANNOUNCEMENTS (Ảnh 1) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Shop Performance Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 4,
                border: '1px solid #e8e8e8',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#262626', margin: 0 }}>
                  Shop Performance
                </h3>
              </div>
              <div style={{ fontSize: 12, color: '#ca8a04', fontWeight: 600, marginBottom: 4 }}>
                Improvement Needed
              </div>
              <p style={{ fontSize: 12, color: '#8c8c8c', margin: 0 }}>
                3 metrics did not meet target
              </p>
            </div>

            {/* Announcement Banner */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 4,
                border: '1px solid #e8e8e8',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#262626', marginBottom: 14 }}>
                Announcements
              </div>

              {/* Banner Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                  borderRadius: 6,
                  padding: '16px',
                  color: '#0f172a',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                  ChickyMart Marketplace
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, margin: '6px 0' }}>
                  INTERNET TRANSACTIONS ACT
                </div>
                <p style={{ fontSize: 11, margin: 0, opacity: 0.9, lineHeight: 1.4 }}>
                  In compliance with the Internet Transactions Act, sellers must have verified tax and safety certificates.
                </p>
              </div>

              {/* News items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#262626', marginBottom: 2 }}>
                    WATCH: ITA PS & ICC Certification
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 11 }}>Today 13:00</div>
                </div>

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                  <div style={{ fontWeight: 700, color: '#262626', marginBottom: 2 }}>
                    Order Packing Guidelines Session
                  </div>
                  <p style={{ color: '#595959', fontSize: 11, margin: '2px 0' }}>
                    Iwasan ang parcel damages by learning how to pack correctly.
                  </p>
                  <div style={{ color: '#8c8c8c', fontSize: 11 }}>Today 10:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  )
}

export default SellerDashboardPage
