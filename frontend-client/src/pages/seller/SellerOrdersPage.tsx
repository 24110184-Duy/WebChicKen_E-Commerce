import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  Ban,
  Eye,
  AlertCircle,
  Printer,
  Copy,
  Check,
  MapPin,
  User,
  Phone,
  Snowflake,
  Download,
  FileText,
  PackageCheck,
  CreditCard,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import { sellerApi } from '../../features/seller/api/sellerApi'
import type {
  SellerOrder,
  SellerOrderStatus,
  SellerOrderStatusCounts,
  FulfillOrderPayload,
} from '../../features/seller/api/sellerApi'
import { FulfillmentModal } from '../../features/seller/components/FulfillmentModal'
import { SellerOrderDetailModal } from '../../features/seller/components/SellerOrderDetailModal'
import { formatMoney } from '../../shared/lib/formatMoney'

interface StatusTabConfig {
  id: SellerOrderStatus
  label: string
  countKey: keyof SellerOrderStatusCounts
  accentColor: string
  icon: React.ElementType
}

const TABS: StatusTabConfig[] = [
  { id: 'ALL', label: 'All Orders', countKey: 'all', accentColor: '#475569', icon: ShoppingBag },
  { id: 'PENDING', label: 'Pending Action', countKey: 'pending', accentColor: '#f59e0b', icon: Clock },
  { id: 'CONFIRMED', label: 'Ready to Ship', countKey: 'confirmed', accentColor: '#2563eb', icon: PackageCheck },
  { id: 'SHIPPING', label: 'In Transit', countKey: 'shipping', accentColor: '#7c3aed', icon: Truck },
  { id: 'DELIVERED', label: 'Completed', countKey: 'delivered', accentColor: '#10b981', icon: CheckCircle2 },
  { id: 'CANCELLED', label: 'Cancelled', countKey: 'cancelled', accentColor: '#ef4444', icon: Ban },
]

export const SellerOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SellerOrderStatus>(() => {
    const params = new URLSearchParams(window.location.search)
    const statusParam = params.get('status')?.toUpperCase()
    if (statusParam && ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].includes(statusParam)) {
      return statusParam as SellerOrderStatus
    }
    return 'ALL'
  })
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('search') || ''
  })
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COD' | 'ONLINE'>('ALL')
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'AMOUNT_DESC'>('NEWEST')

  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [statusCounts, setStatusCounts] = useState<SellerOrderStatusCounts>({
    all: 0,
    pending: 0,
    confirmed: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Bulk Selection State
  const [selectedOrderCodes, setSelectedOrderCodes] = useState<string[]>([])

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState<boolean>(false)
  const [orderToFulfill, setOrderToFulfill] = useState<SellerOrder | null>(null)

  // Cancel modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)
  const [orderToCancel, setOrderToCancel] = useState<SellerOrder | null>(null)
  const [cancelReason, setCancelReason] = useState<string>('Out of stock at farm storage')

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    showToast(`Copied ${text} to clipboard!`, 'success')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await sellerApi.fetchStoreOrders('store-1', {
        status: 'ALL',
      })
      setOrders(res.items)
      setStatusCounts(res.counts)
    } catch {
      showToast('Failed to load store orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Filtered & Sorted orders
  const displayedOrders = useMemo(() => {
    let result = [...orders]

    // Status Tab Filter
    if (activeTab !== 'ALL') {
      result = result.filter((o) => o.status === activeTab)
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.recipientName.toLowerCase().includes(q) ||
          o.recipientPhone.toLowerCase().includes(q) ||
          (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q)) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
      )
    }

    // Payment Filter
    if (paymentFilter === 'COD') {
      result = result.filter((o) => o.paymentMethod.toUpperCase().includes('COD'))
    } else if (paymentFilter === 'ONLINE') {
      result = result.filter((o) => !o.paymentMethod.toUpperCase().includes('COD'))
    }

    // Carrier Filter
    if (carrierFilter !== 'ALL') {
      result = result.filter((o) => o.carrier?.toLowerCase().includes(carrierFilter.toLowerCase()))
    }

    // Sort
    if (sortBy === 'NEWEST') {
      result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    } else if (sortBy === 'OLDEST') {
      result.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())
    } else if (sortBy === 'AMOUNT_DESC') {
      result.sort((a, b) => b.totalAmountMinor - a.totalAmountMinor)
    }

    return result
  }, [orders, activeTab, searchQuery, paymentFilter, carrierFilter, sortBy])

  // Bulk Selection Helpers
  const isAllSelected = displayedOrders.length > 0 && selectedOrderCodes.length === displayedOrders.length

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderCodes([])
    } else {
      setSelectedOrderCodes(displayedOrders.map((o) => o.orderCode))
    }
  }

  const handleToggleSelect = (orderCode: string) => {
    setSelectedOrderCodes((prev) =>
      prev.includes(orderCode) ? prev.filter((c) => c !== orderCode) : [...prev, orderCode]
    )
  }

  // Quick action: Confirm single order
  const handleConfirmOrder = async (order: SellerOrder) => {
    setActionLoading(order.orderCode)
    try {
      await sellerApi.updateStoreOrderStatus('store-1', order.orderCode, {
        status: 'CONFIRMED',
        reason: 'Seller confirmed order and began packaging preparation',
      })
      showToast(`Order #${order.orderCode} confirmed. Ready to pack!`, 'success')
      if (isDetailModalOpen && selectedOrder?.orderCode === order.orderCode) {
        setIsDetailModalOpen(false)
      }
      await loadOrders()
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm order', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // Batch action: Confirm selected pending orders
  const handleBatchConfirm = async () => {
    const pendingSelected = orders.filter(
      (o) => selectedOrderCodes.includes(o.orderCode) && o.status === 'PENDING'
    )
    if (pendingSelected.length === 0) {
      showToast('No pending orders in selection to confirm', 'error')
      return
    }

    setLoading(true)
    let count = 0
    for (const order of pendingSelected) {
      try {
        await sellerApi.updateStoreOrderStatus('store-1', order.orderCode, {
          status: 'CONFIRMED',
          reason: 'Batch confirmed by Seller',
        })
        count++
      } catch (e) {
        console.error(e)
      }
    }
    showToast(`Batch confirmed ${count} order(s) successfully!`, 'success')
    setSelectedOrderCodes([])
    await loadOrders()
  }

  // Quick action: Open dispatch modal
  const handleOpenFulfillment = (order: SellerOrder) => {
    setOrderToFulfill(order)
    setIsFulfillmentModalOpen(true)
  }

  // Submit fulfillment dispatch
  const handleFulfillSubmit = async (payload: FulfillOrderPayload) => {
    if (!orderToFulfill) return
    try {
      await sellerApi.updateStoreOrderStatus('store-1', orderToFulfill.orderCode, payload)
      showToast(`Order #${orderToFulfill.orderCode} dispatched via ${payload.carrier}!`, 'success')
      setIsFulfillmentModalOpen(false)
      setOrderToFulfill(null)
      await loadOrders()
    } catch (err: any) {
      showToast(err.message || 'Dispatch failed', 'error')
    }
  }

  // Quick action: Mark delivered
  const handleMarkDelivered = async (order: SellerOrder) => {
    setActionLoading(order.orderCode)
    try {
      await sellerApi.updateStoreOrderStatus('store-1', order.orderCode, {
        status: 'DELIVERED',
        reason: 'Carrier confirmed successful handover to buyer',
      })
      showToast(`Order #${order.orderCode} marked as Delivered!`, 'success')
      if (isDetailModalOpen && selectedOrder?.orderCode === order.orderCode) {
        setIsDetailModalOpen(false)
      }
      await loadOrders()
    } catch (err: any) {
      showToast(err.message || 'Failed to update delivery status', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // Open cancel modal
  const handlePromptCancel = (order: SellerOrder) => {
    setOrderToCancel(order)
    setCancelReason('Out of stock at farm storage')
    setIsCancelModalOpen(true)
  }

  // Confirm cancel
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return
    setActionLoading(orderToCancel.orderCode)
    try {
      await sellerApi.updateStoreOrderStatus('store-1', orderToCancel.orderCode, {
        status: 'CANCELLED',
        reason: cancelReason,
      })
      showToast(`Order #${orderToCancel.orderCode} has been cancelled`, 'success')
      setIsCancelModalOpen(false)
      setOrderToCancel(null)
      if (isDetailModalOpen) setIsDetailModalOpen(false)
      await loadOrders()
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // Export CSV feature
  const handleExportCSV = () => {
    if (displayedOrders.length === 0) {
      showToast('No orders to export', 'error')
      return
    }

    const headers = [
      'Order Code',
      'Date',
      'Customer',
      'Phone',
      'Address',
      'Status',
      'Payment Method',
      'Payment Status',
      'Total Amount (VND)',
      'Carrier',
      'Tracking Number',
    ]

    const rows = displayedOrders.map((o) => [
      `"${o.orderCode}"`,
      `"${new Date(o.orderDate).toLocaleString('vi-VN')}"`,
      `"${o.recipientName}"`,
      `"${o.recipientPhone}"`,
      `"${o.shippingAddress.replace(/"/g, '""')}"`,
      `"${o.status}"`,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus}"`,
      o.totalAmountMinor,
      `"${o.carrier || 'N/A'}"`,
      `"${o.trackingNumber || 'N/A'}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `WebChicKen_Orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Exported orders CSV report successfully!', 'success')
  }

  // Print packing slips for selected orders
  const handlePrintSelected = () => {
    if (selectedOrderCodes.length === 0) {
      showToast('Please select at least one order to print packing slip', 'error')
      return
    }
    const targetOrder = orders.find((o) => o.orderCode === selectedOrderCodes[0])
    if (targetOrder) {
      setSelectedOrder(targetOrder)
      setIsDetailModalOpen(true)
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }

  return (
    <SellerLayout>
      <div className="seller-orders-container">
        {/* Floating Toast Notification */}
        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 22px',
              borderRadius: 14,
              backgroundColor: toastMsg.type === 'success' ? '#0f766e' : '#be123c',
              color: '#ffffff',
              fontWeight: 600,
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              fontSize: 14,
              animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 style={{ width: 20, height: 20, color: '#34d399' }} />
            ) : (
              <AlertCircle style={{ width: 20, height: 20, color: '#fca5a5' }} />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* 1. Header & Live Indicator */}
        <div className="seller-orders-header-wrap">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 className="seller-page-title" style={{ margin: 0 }}>
                Order Management & Fulfillment
              </h1>
              <span className="seller-live-badge">
                <span className="seller-live-dot" />
                Live Fulfillment Hub
              </span>
            </div>
            <p className="seller-page-subtitle" style={{ margin: 0 }}>
              Inspect incoming buyer orders, enforce 0-4°C cold-chain packing integrity, and dispatch to logistics partners.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              className="seller-outline-action-btn"
              title="Export current order list to CSV spreadsheet"
            >
              <Download style={{ width: 15, height: 15 }} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="seller-primary-refresh-btn"
            >
              <RefreshCw
                style={{
                  width: 15,
                  height: 15,
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>

        {/* 2. Bento Dashboard Metric Cards */}
        <div className="seller-bento-metrics">
          {/* Card 1: Pending */}
          <div
            className={`seller-bento-card ${activeTab === 'PENDING' ? 'active-filter' : ''}`}
            onClick={() => setActiveTab('PENDING')}
            style={{ borderLeft: '4px solid #f59e0b' }}
          >
            <div className="seller-bento-top">
              <span className="seller-bento-label">Awaiting Confirmation</span>
              <div className="seller-bento-icon-box" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                <Clock style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div className="seller-bento-number" style={{ color: '#b45309' }}>
              {statusCounts.pending}
            </div>
            <div className="seller-bento-footer">
              <span className="seller-pill-urgent">SLA &lt; 2h dispatch</span>
              <span>Needs action</span>
            </div>
          </div>

          {/* Card 2: Confirmed / Pack */}
          <div
            className={`seller-bento-card ${activeTab === 'CONFIRMED' ? 'active-filter' : ''}`}
            onClick={() => setActiveTab('CONFIRMED')}
            style={{ borderLeft: '4px solid #2563eb' }}
          >
            <div className="seller-bento-top">
              <span className="seller-bento-label">Ready for Carrier</span>
              <div className="seller-bento-icon-box" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                <PackageCheck style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div className="seller-bento-number" style={{ color: '#1d4ed8' }}>
              {statusCounts.confirmed}
            </div>
            <div className="seller-bento-footer">
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Packing & Waybills</span>
              <span>Ready to ship</span>
            </div>
          </div>

          {/* Card 3: In Transit */}
          <div
            className={`seller-bento-card ${activeTab === 'SHIPPING' ? 'active-filter' : ''}`}
            onClick={() => setActiveTab('SHIPPING')}
            style={{ borderLeft: '4px solid #7c3aed' }}
          >
            <div className="seller-bento-top">
              <span className="seller-bento-label">On Delivery Route</span>
              <div className="seller-bento-icon-box" style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                <Truck style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div className="seller-bento-number" style={{ color: '#6d28d9' }}>
              {statusCounts.shipping}
            </div>
            <div className="seller-bento-footer">
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>Cold-chain courier</span>
              <span>In transit</span>
            </div>
          </div>

          {/* Card 4: Total & Delivered */}
          <div
            className={`seller-bento-card ${activeTab === 'ALL' ? 'active-filter' : ''}`}
            onClick={() => setActiveTab('ALL')}
            style={{ borderLeft: '4px solid #10b981' }}
          >
            <div className="seller-bento-top">
              <span className="seller-bento-label">Completed Deliveries</span>
              <div className="seller-bento-icon-box" style={{ backgroundColor: '#d1fae5', color: '#047857' }}>
                <CheckCircle2 style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div className="seller-bento-number" style={{ color: '#047857' }}>
              {statusCounts.delivered}
            </div>
            <div className="seller-bento-footer">
              <span>{statusCounts.all} total placed</span>
              <span style={{ color: '#64748b' }}>({statusCounts.cancelled} cancelled)</span>
            </div>
          </div>
        </div>

        {/* 3. Status Tabs Navigation */}
        <div className="seller-tabs-container">
          <div className="seller-tabs-scroll">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const count = statusCounts[tab.countKey]
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSelectedOrderCodes([])
                  }}
                  className={`seller-tab-btn ${isActive ? 'active' : ''}`}
                  style={{
                    borderColor: isActive ? tab.accentColor : 'transparent',
                  }}
                >
                  <Icon
                    style={{
                      width: 16,
                      height: 16,
                      color: isActive ? tab.accentColor : '#64748b',
                    }}
                  />
                  <span>{tab.label}</span>
                  <span
                    className="seller-tab-count-pill"
                    style={{
                      backgroundColor: isActive ? tab.accentColor : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#334155',
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. Search & Multi-Filter Control Bar */}
        <div className="seller-controls-card">
          <div className="seller-controls-row">
            {/* Search Input */}
            <div className="seller-search-wrapper">
              <Search className="seller-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault()
                }}
                placeholder="Search by Order Code (ORD-...), Customer name, Phone, or Parcel item..."
                className="seller-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="seller-search-clear"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Payment Filter */}
            <div className="seller-filter-select-wrap">
              <CreditCard style={{ width: 15, height: 15, color: '#64748b' }} />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="seller-select-field"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="ONLINE">VNPay / Online Paid</option>
              </select>
            </div>

            {/* Carrier Filter */}
            <div className="seller-filter-select-wrap">
              <Truck style={{ width: 15, height: 15, color: '#64748b' }} />
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="seller-select-field"
              >
                <option value="ALL">All Logistics Carriers</option>
                <option value="Chicky Express">Chicky Express (0-4°C)</option>
                <option value="GHTK">GHTK Express</option>
                <option value="GHN">GHN Logistics</option>
                <option value="Viettel">Viettel Post</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="seller-filter-select-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="seller-select-field"
              >
                <option value="NEWEST">Date: Newest First</option>
                <option value="OLDEST">Date: Oldest First</option>
                <option value="AMOUNT_DESC">Amount: High to Low</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Info & Select All bar */}
          <div className="seller-sub-filter-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="seller-select-all-btn"
              >
                {isAllSelected ? (
                  <CheckSquare style={{ width: 16, height: 16, color: '#d97706' }} />
                ) : (
                  <Square style={{ width: 16, height: 16, color: '#94a3b8' }} />
                )}
                <span>Select All ({displayedOrders.length} orders)</span>
              </button>

              {(searchQuery || paymentFilter !== 'ALL' || carrierFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setPaymentFilter('ALL')
                    setCarrierFilter('ALL')
                  }}
                  className="seller-reset-filters-btn"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            <span className="seller-showing-count">
              Showing <strong>{displayedOrders.length}</strong> of {statusCounts[TABS.find((t) => t.id === activeTab)?.countKey || 'all']} orders
            </span>
          </div>
        </div>

        {/* 5. Orders List / Empty State / Loading State */}
        {loading ? (
          <div className="seller-loading-state">
            <RefreshCw style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Loading order pipeline...</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Synchronizing with cold-chain fulfillment database</div>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="seller-empty-orders-card">
            <div className="seller-empty-icon-circle">
              <ShoppingBag style={{ width: 32, height: 32 }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              No orders found
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748b', maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.5 }}>
              {searchQuery || paymentFilter !== 'ALL' || carrierFilter !== 'ALL'
                ? `No orders matching your current search query or filter selection. Try clearing search filters.`
                : `There are currently no orders under "${TABS.find((t) => t.id === activeTab)?.label}". New customer purchases will show up here automatically.`}
            </p>
            {(searchQuery || paymentFilter !== 'ALL' || carrierFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setPaymentFilter('ALL')
                  setCarrierFilter('ALL')
                  setActiveTab('ALL')
                }}
                className="seller-primary-refresh-btn"
              >
                Show All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="seller-orders-list">
            {displayedOrders.map((order) => {
              const isSelected = selectedOrderCodes.includes(order.orderCode)
              const isActionLoading = actionLoading === order.orderCode

              // Status badges info
              const isPending = order.status === 'PENDING'
              const isConfirmed = order.status === 'CONFIRMED'
              const isShipping = order.status === 'SHIPPING'
              const isDelivered = order.status === 'DELIVERED'
              const isCancelled = order.status === 'CANCELLED'

              return (
                <div
                  key={order.id}
                  className={`seller-pro-order-card ${isSelected ? 'selected' : ''}`}
                >
                  {/* Card Header Strip */}
                  <div className="seller-order-card-header-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(order.orderCode)}
                        className="seller-card-checkbox"
                        title={isSelected ? 'Deselect order' : 'Select order'}
                      >
                        {isSelected ? (
                          <CheckSquare style={{ width: 18, height: 18, color: '#d97706' }} />
                        ) : (
                          <Square style={{ width: 18, height: 18, color: '#94a3b8' }} />
                        )}
                      </button>

                      {/* Order Code & Copy */}
                      <div className="seller-order-code-badge">
                        <span className="seller-order-code-text">#{order.orderCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.orderCode, order.orderCode)}
                          className="seller-code-copy-btn"
                          title="Copy order code"
                        >
                          {copiedCode === order.orderCode ? (
                            <Check style={{ width: 13, height: 13, color: '#10b981' }} />
                          ) : (
                            <Copy style={{ width: 13, height: 13 }} />
                          )}
                        </button>
                      </div>

                      {/* Date & Time */}
                      <div className="seller-order-time-stamp">
                        <Calendar style={{ width: 13, height: 13, color: '#94a3b8' }} />
                        <span>
                          {new Date(order.orderDate).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Payment Status & Order Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Payment Pill */}
                      <div className="seller-pay-method-pill">
                        <span>{order.paymentMethod}</span>
                        <span
                          className={`seller-pay-status-tag ${
                            order.paymentStatus === 'PAID' ? 'paid' : 'unpaid'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>

                      {/* Order Status Badge */}
                      <span className={`seller-status-badge status-${order.status.toLowerCase()}`}>
                        {isPending && <Clock style={{ width: 13, height: 13 }} />}
                        {isConfirmed && <PackageCheck style={{ width: 13, height: 13 }} />}
                        {isShipping && <Truck style={{ width: 13, height: 13 }} />}
                        {isDelivered && <CheckCircle2 style={{ width: 13, height: 13 }} />}
                        {isCancelled && <Ban style={{ width: 13, height: 13 }} />}
                        <span>{order.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content Grid (4 Columns) */}
                  <div className="seller-order-grid-content">
                    {/* Col 1: Parcel Items */}
                    <div className="seller-col-parcel-items">
                      <div className="seller-col-sub-header">
                        <span>PARCEL CONTENTS ({order.items.reduce((s, i) => s + i.quantity, 0)} ITEMS)</span>
                        <span className="seller-cold-tag">
                          <Snowflake style={{ width: 11, height: 11 }} />
                          Cold-Chain 0-4°C
                        </span>
                      </div>

                      <div className="seller-order-items-stack">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="seller-order-item-card">
                            <img
                              src={
                                item.imageUrl ||
                                'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=150'
                              }
                              alt={item.productName}
                              className="seller-order-item-thumb"
                            />
                            <div className="seller-order-item-info">
                              <span className="seller-order-item-name" title={item.productName}>
                                {item.productName}
                              </span>
                              <div className="seller-order-item-variant-pill">
                                <span>{item.variantName || 'Standard Cut'}</span>
                                <span className="seller-qty-badge">x{item.quantity}</span>
                              </div>
                              <div className="seller-order-item-price-line">
                                <span>{formatMoney(item.unitPriceAtPurchaseMinor)} / unit</span>
                                <strong style={{ color: '#0f172a' }}>
                                  {formatMoney(item.unitPriceAtPurchaseMinor * item.quantity)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))}

                        {order.items.length > 2 && (
                          <div className="seller-more-items-notice">
                            <FileText style={{ width: 13, height: 13 }} />
                            <span>+{order.items.length - 2} additional item(s) in this cold-chain parcel</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Col 2: Customer & Shipping Address */}
                    <div className="seller-col-recipient">
                      <div className="seller-col-sub-header">
                        <span>DELIVERY DESTINATION</span>
                      </div>

                      <div className="seller-recipient-card-box">
                        <div className="seller-recipient-row">
                          <User style={{ width: 14, height: 14, color: '#64748b' }} />
                          <strong style={{ color: '#0f172a', fontSize: 13.5 }}>{order.recipientName}</strong>
                        </div>
                        <div className="seller-recipient-row">
                          <Phone style={{ width: 14, height: 14, color: '#64748b' }} />
                          <span style={{ color: '#2563eb', fontWeight: 600, fontSize: 13 }}>
                            {order.recipientPhone}
                          </span>
                        </div>
                        <div className="seller-recipient-row address" title={order.shippingAddress}>
                          <MapPin style={{ width: 14, height: 14, color: '#64748b', flexShrink: 0, marginTop: 2 }} />
                          <span style={{ color: '#475569', fontSize: 12.5, lineHeight: 1.4 }}>
                            {order.shippingAddress}
                          </span>
                        </div>

                        {order.note && (
                          <div className="seller-customer-note-box">
                            <span style={{ fontWeight: 700, color: '#b45309', marginRight: 4 }}>Note:</span>
                            <span>{order.note}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Logistics & Carrier Details */}
                    <div className="seller-col-logistics">
                      <div className="seller-col-sub-header">
                        <span>CARRIER & TRACKING</span>
                      </div>

                      <div className="seller-logistics-box">
                        <div className="seller-carrier-row">
                          <Truck style={{ width: 16, height: 16, color: '#2563eb' }} />
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                            {order.carrier || 'Pending Dispatch Assignment'}
                          </span>
                        </div>

                        {order.trackingNumber ? (
                          <div className="seller-tracking-pill-box">
                            <span className="seller-tracking-code-val">
                              {order.trackingNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.trackingNumber!, `track-${order.orderCode}`)}
                              className="seller-tracking-copy-btn"
                              title="Copy tracking code"
                            >
                              {copiedCode === `track-${order.orderCode}` ? (
                                <Check style={{ width: 12, height: 12, color: '#10b981' }} />
                              ) : (
                                <Copy style={{ width: 12, height: 12 }} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="seller-no-waybill-text">
                            Awaiting fulfillment dispatch waybill
                          </div>
                        )}

                        {/* Cold Chain Checklist Checklist Indicator */}
                        <div className="seller-cold-checklist">
                          <div className="seller-checklist-item">
                            <CheckCircle2 style={{ width: 12, height: 12, color: '#10b981' }} />
                            <span>Ice Gel Packs (4x)</span>
                          </div>
                          <div className="seller-checklist-item">
                            <CheckCircle2 style={{ width: 12, height: 12, color: '#10b981' }} />
                            <span>Tamper-evident Seal</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col 4: Total & Primary Actions */}
                    <div className="seller-col-actions">
                      <div className="seller-col-sub-header">
                        <span>ORDER REVENUE</span>
                      </div>

                      <div className="seller-amount-display">
                        <span className="seller-total-price-text">
                          {formatMoney(order.totalAmountMinor)}
                        </span>
                        <span className="seller-shipping-fee-sub">
                          Included {formatMoney(order.shippingFeeMinor || 25000)} cold shipping
                        </span>
                      </div>

                      {/* Action Button Set */}
                      <div className="seller-actions-btn-stack">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(order)}
                              disabled={isActionLoading}
                              className="seller-btn-primary-confirm"
                            >
                              <CheckCircle2 style={{ width: 15, height: 15 }} />
                              <span>{isActionLoading ? 'Confirming...' : 'Accept Order'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePromptCancel(order)}
                              disabled={isActionLoading}
                              className="seller-btn-danger-reject"
                            >
                              <span>Reject / Out of Stock</span>
                            </button>
                          </>
                        )}

                        {isConfirmed && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenFulfillment(order)}
                              className="seller-btn-primary-dispatch"
                            >
                              <Truck style={{ width: 16, height: 16 }} />
                              <span>Dispatch / Ship Order</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsDetailModalOpen(true)
                                setTimeout(() => window.print(), 500)
                              }}
                              className="seller-btn-outline-print"
                            >
                              <Printer style={{ width: 14, height: 14 }} />
                              <span>Print Packing Slip</span>
                            </button>
                          </>
                        )}

                        {isShipping && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMarkDelivered(order)}
                              disabled={isActionLoading}
                              className="seller-btn-primary-delivered"
                            >
                              <CheckCircle2 style={{ width: 15, height: 15 }} />
                              <span>Mark Delivered</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsDetailModalOpen(true)
                                setTimeout(() => window.print(), 500)
                              }}
                              className="seller-btn-outline-print"
                            >
                              <Printer style={{ width: 14, height: 14 }} />
                              <span>Print Packing Slip</span>
                            </button>
                          </>
                        )}

                        {isDelivered && (
                          <div className="seller-delivered-done-tag">
                            <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981' }} />
                            <span>Customer Handover Completed</span>
                          </div>
                        )}

                        {isCancelled && (
                          <div className="seller-cancelled-done-tag">
                            <Ban style={{ width: 15, height: 15, color: '#ef4444' }} />
                            <span>Order Voided & Stock Returned</span>
                          </div>
                        )}

                        {/* View Full Details Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsDetailModalOpen(true)
                          }}
                          className="seller-btn-view-details"
                        >
                          <Eye style={{ width: 14, height: 14 }} />
                          <span>View Full Details & History</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 6. Floating Multi-Order Batch Toolbar */}
        {selectedOrderCodes.length > 0 && (
          <div className="seller-floating-batch-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="seller-batch-count-pill">
                <Sparkles style={{ width: 14, height: 14 }} />
                <span>{selectedOrderCodes.length} order(s) selected</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderCodes([])}
                className="seller-batch-clear-btn"
              >
                Deselect All
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={handlePrintSelected}
                className="seller-batch-action-btn"
              >
                <Printer style={{ width: 15, height: 15 }} />
                <span>Print Selected Slips</span>
              </button>

              <button
                type="button"
                onClick={handleBatchConfirm}
                className="seller-batch-action-btn primary"
              >
                <CheckCircle2 style={{ width: 15, height: 15 }} />
                <span>Batch Accept Orders</span>
              </button>
            </div>
          </div>
        )}

        {/* 7. Modals: Fulfillment Dispatch Modal */}
        {orderToFulfill && (
          <FulfillmentModal
            order={orderToFulfill}
            isOpen={isFulfillmentModalOpen}
            onClose={() => {
              setIsFulfillmentModalOpen(false)
              setOrderToFulfill(null)
            }}
            onSubmit={handleFulfillSubmit}
          />
        )}

        {/* 8. Modals: Order Detail & Packing Slip Modal */}
        {selectedOrder && (
          <SellerOrderDetailModal
            order={selectedOrder}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false)
              setSelectedOrder(null)
            }}
            onConfirmOrder={handleConfirmOrder}
            onOpenFulfillment={handleOpenFulfillment}
            onMarkDelivered={handleMarkDelivered}
            onCancelOrder={handlePromptCancel}
          />
        )}

        {/* 9. Cancel Confirmation Dialog */}
        {isCancelModalOpen && orderToCancel && (
          <div className="seller-modal-overlay">
            <div className="seller-modal-box" style={{ maxWidth: 460 }}>
              <div className="seller-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
                  <Ban style={{ width: 22, height: 22 }} />
                  <h3 className="seller-modal-title" style={{ color: '#ef4444' }}>
                    Cancel Order #{orderToCancel.orderCode}
                  </h3>
                </div>
              </div>

              <div className="seller-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
                  Are you sure you want to cancel this order? This will release reserved poultry stock back to farm inventory and notify the buyer.
                </p>

                <div className="seller-form-group">
                  <label className="seller-form-label">Cancellation Reason *</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="seller-form-select"
                  >
                    <option value="Out of stock at farm storage">Out of stock at farm storage</option>
                    <option value="Customer requested cancellation">Customer requested cancellation</option>
                    <option value="Unable to guarantee cold-chain delivery to address">
                      Unable to guarantee cold-chain delivery to address
                    </option>
                    <option value="Pricing or product attribute error">Pricing or product attribute error</option>
                  </select>
                </div>
              </div>

              <div className="seller-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="seller-modal-cancel-btn"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="seller-modal-submit-btn"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerOrdersPage
