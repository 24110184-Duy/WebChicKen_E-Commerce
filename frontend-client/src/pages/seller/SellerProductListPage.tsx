import React, { useState, useEffect, useMemo } from 'react'
import { SellerLayout } from '../../layouts/SellerLayout'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import {
  sellerApi,
  type SellerProductItem,
  type ProductStatus,
  STANDARD_CATEGORIES,
} from '../../features/seller/api/sellerApi'
import { ProductFormModal } from '../../features/seller/components/ProductFormModal'
import { formatMoney } from '../../shared/lib/formatMoney'

export const SellerProductListPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<SellerProductItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<ProductStatus | 'ALL' | 'LOW_STOCK'>(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')?.toUpperCase()
    if (tabParam && ['ALL', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'LOW_STOCK', 'PENDING_APPROVAL'].includes(tabParam)) {
      return tabParam as any
    }
    return 'ALL'
  })
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<SellerProductItem | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      // Load all store products to maintain stable, persistent catalog metrics
      const res = await sellerApi.getStoreProducts('store-1')
      setAllProducts(res.items)
    } catch {
      setAllProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')?.toUpperCase()
    if (tabParam && ['ALL', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'LOW_STOCK', 'PENDING_APPROVAL'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [])

  // Fixed Catalog Metrics computed across ALL store products (stays unchanged when switching tabs or filtering)
  const metrics = useMemo(() => {
    const total = allProducts.length
    const active = allProducts.filter((p) => p.status === 'ACTIVE').length
    const inactive = allProducts.filter((p) => p.status === 'INACTIVE').length
    const lowStock = allProducts.filter((p) => (p.totalStock || 0) > 0 && (p.totalStock || 0) <= 15).length
    const outOfStock = allProducts.filter((p) => p.status === 'OUT_OF_STOCK' || p.totalStock === 0).length
    const totalUnits = allProducts.reduce((sum, p) => sum + (p.totalStock || 0), 0)
    return { total, active, inactive, lowStock, outOfStock, totalUnits }
  }, [allProducts])

  // Filtered products list for table display based on active tab, search query, and category
  const displayedProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // 1. Status Tab filter
      if (activeTab === 'ACTIVE' && p.status !== 'ACTIVE') return false
      if (activeTab === 'INACTIVE' && p.status !== 'INACTIVE') return false
      if (activeTab === 'LOW_STOCK' && !((p.totalStock || 0) > 0 && (p.totalStock || 0) <= 15)) return false
      if (activeTab === 'OUT_OF_STOCK' && !(p.status === 'OUT_OF_STOCK' || p.totalStock === 0)) return false
      if (activeTab === 'PENDING_APPROVAL' && p.status !== 'PENDING_APPROVAL') return false

      // 2. Category filter
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesDesc = (p.description || '').toLowerCase().includes(q)
        const matchesCat = (p.categoryName || '').toLowerCase().includes(q)
        const matchesVar = p.variants?.some((v) => v.attribute.toLowerCase().includes(q))
        if (!matchesName && !matchesDesc && !matchesCat && !matchesVar) return false
      }

      return true
    })
  }, [allProducts, activeTab, selectedCategory, searchQuery])

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (product: SellerProductItem) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleModalSuccess = (saved: SellerProductItem) => {
    showToast(
      editingProduct
        ? `Product "${saved.name}" updated successfully!`
        : `Product "${saved.name}" added to catalog!`
    )
    loadProducts()
  }

  const handleTogglePublication = async (product: SellerProductItem) => {
    const nextStatus: ProductStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await sellerApi.setProductPublication('store-1', product.id, nextStatus)
      showToast(`Product is now ${nextStatus === 'ACTIVE' ? 'LIVE on Storefront' : 'HIDDEN from Storefront'}`)
      loadProducts()
    } catch {
      showToast('Failed to update publication status.')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await sellerApi.deleteStoreProduct('store-1', productId)
      setDeletingProductId(null)
      showToast('Product removed from catalog.')
      loadProducts()
    } catch {
      showToast('Failed to delete product.')
    }
  }

  return (
    <SellerLayout>
      {/* 1. Header Title & CTA Button */}
      <div className="seller-header-row">
        <div>
          <h1 className="seller-header-title">Product Catalog & Inventory</h1>
          <p className="seller-header-sub">
            Manage your store's poultry items, SKU price variations, and real-time inventory levels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="seller-btn-primary"
        >
          <Plus style={{ width: 18, height: 18 }} />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="seller-metrics-grid">
        <div className="seller-metric-card">
          <div className="seller-metric-icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <Package style={{ width: 22, height: 22 }} />
          </div>
          <div className="seller-metric-info">
            <span className="seller-metric-label">Total Catalog Products</span>
            <span className="seller-metric-val">{metrics.total}</span>
          </div>
        </div>

        <div className="seller-metric-card">
          <div className="seller-metric-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <TrendingUp style={{ width: 22, height: 22 }} />
          </div>
          <div className="seller-metric-info">
            <span className="seller-metric-label">Active & Selling</span>
            <span className="seller-metric-val">{metrics.active}</span>
          </div>
        </div>

        <div className="seller-metric-card">
          <div className="seller-metric-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
            <AlertTriangle style={{ width: 22, height: 22 }} />
          </div>
          <div className="seller-metric-info">
            <span className="seller-metric-label">Out of Stock Alert</span>
            <span className="seller-metric-val">{metrics.outOfStock}</span>
          </div>
        </div>

        <div className="seller-metric-card">
          <div className="seller-metric-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
            <Boxes style={{ width: 22, height: 22 }} />
          </div>
          <div className="seller-metric-info">
            <span className="seller-metric-label">Total Units in Stock</span>
            <span className="seller-metric-val">{metrics.totalUnits.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Data Card */}
      <div className="seller-card">
        {/* Status Filter Tabs */}
        <div className="seller-filter-tabs">
          {[
            { key: 'ALL', label: 'All Products', count: metrics.total },
            { key: 'ACTIVE', label: 'Active (Live)', count: metrics.active },
            { key: 'LOW_STOCK', label: 'Low Stock (≤15)', count: metrics.lowStock, isWarning: true },
            { key: 'OUT_OF_STOCK', label: 'Out of Stock', count: metrics.outOfStock, isDanger: true },
            { key: 'INACTIVE', label: 'Inactive (Hidden)', count: metrics.inactive },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`seller-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              <span
                className="seller-tab-count"
                style={
                  tab.isDanger && tab.count > 0
                    ? { color: '#ef4444' }
                    : tab.isWarning && tab.count > 0
                    ? { color: '#d97706', backgroundColor: '#fef3c7' }
                    : undefined
                }
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter Row */}
        <div className="seller-search-row">
          <div className="seller-search-box">
            <Search className="seller-search-icon" style={{ width: 17, height: 17 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              placeholder="Search by product name, variant attribute, or cut..."
              className="seller-search-input"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="seller-select-input"
          >
            <option value="ALL">All Categories</option>
            {STANDARD_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Table */}
        <div className="seller-table-wrap">
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14 }}>Loading store products...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Package style={{ width: 44, height: 44, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                No products found
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 400, margin: '0 auto 16px' }}>
                {searchQuery || selectedCategory !== 'ALL' || activeTab !== 'ALL'
                  ? 'No products matched your search or status filter criteria.'
                  : 'You have not added any poultry products to your store yet.'}
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="seller-btn-primary"
                style={{ margin: '0 auto' }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                <span>Add Your First Product</span>
              </button>
            </div>
          ) : (
            <table className="seller-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Product SPU</th>
                  <th style={{ width: '20%' }}>Price Range</th>
                  <th style={{ width: '14%' }}>Total Stock</th>
                  <th style={{ width: '14%' }}>Status</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const isHealthyStock = p.totalStock > 15
                  const isLowStock = p.totalStock > 0 && p.totalStock <= 15

                  return (
                    <tr key={p.id}>
                      {/* Product details */}
                      <td>
                        <div className="seller-product-col">
                          <img
                            src={p.thumbnailUrl || p.imageUrls[0] || '/placeholder-product.png'}
                            alt={p.name}
                            className="seller-product-thumb"
                          />
                          <div className="seller-product-info">
                            <h4 className="seller-product-name">{p.name}</h4>
                            <div className="seller-product-meta">
                              <span style={{ color: '#0284c7', fontWeight: 600 }}>
                                {p.categoryName || 'Poultry'}
                              </span>
                              <span>•</span>
                              <span>{p.variantsCount} variant{p.variantsCount > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price Range */}
                      <td>
                        <span className="seller-price-text">
                          {p.minPriceMinor === p.maxPriceMinor
                            ? formatMoney(p.minPriceMinor)
                            : `${formatMoney(p.minPriceMinor)} - ${formatMoney(p.maxPriceMinor)}`}
                        </span>
                      </td>

                      {/* Total Stock */}
                      <td>
                        <span
                          className={`seller-stock-pill ${
                            isHealthyStock ? 'healthy' : isLowStock ? 'low' : 'depleted'
                          }`}
                        >
                          {p.totalStock} units
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {p.status === 'ACTIVE' && (
                          <span className="seller-status-badge active">
                            <CheckCircle2 style={{ width: 12, height: 12 }} /> Live
                          </span>
                        )}
                        {p.status === 'INACTIVE' && (
                          <span className="seller-status-badge inactive">
                            <EyeOff style={{ width: 12, height: 12 }} /> Hidden
                          </span>
                        )}
                        {p.status === 'OUT_OF_STOCK' && (
                          <span className="seller-status-badge out-of-stock">
                            <AlertTriangle style={{ width: 12, height: 12 }} /> Out of Stock
                          </span>
                        )}
                        {p.status === 'PENDING_APPROVAL' && (
                          <span className="seller-status-badge pending">
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td>
                        <div className="seller-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          {/* Toggle Active / Inactive */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublication(p)}
                            className="seller-action-btn toggle"
                            title={p.status === 'ACTIVE' ? 'Hide from storefront' : 'Publish to storefront'}
                          >
                            {p.status === 'ACTIVE' ? (
                              <EyeOff style={{ width: 13, height: 13 }} />
                            ) : (
                              <Eye style={{ width: 13, height: 13 }} />
                            )}
                          </button>

                          {/* Edit Product */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="seller-action-btn"
                            title="Edit product & variants"
                          >
                            <Edit2 style={{ width: 13, height: 13 }} />
                          </button>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => setDeletingProductId(p.id)}
                            className="seller-action-btn delete"
                            title="Delete product"
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="seller-modal-overlay" onClick={() => setDeletingProductId(null)}>
          <div
            className="seller-modal-box"
            style={{ maxWidth: 440, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Confirm Product Removal
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to remove this product and all its SKU variants from your store catalog? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeletingProductId(null)}
                className="seller-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deletingProductId)}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Remove Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal Dialog */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialProduct={editingProduct}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#facc15',
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </SellerLayout>
  )
}

export default SellerProductListPage
