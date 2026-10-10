import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Package,
  Plus,
  ChevronDown,
  LayoutList,
  LayoutGrid,
  Eye,
  Heart,
  Loader2,
  Edit3,
  Download,
  Trash2,
} from 'lucide-react'
import { SellerLayout } from '../../layouts/SellerLayout'
import {
  sellerApi,
  type SellerProductItem,
  type ProductCategoryOption,
} from '../../features/seller/api/sellerApi'
import { ProductFormModal } from '../../features/seller/components/ProductFormModal'
import { formatMoney } from '../../shared/lib/formatMoney'
import { toast } from '../../components/feedback/Toast'
import { useAuthStore } from '../../app/store/authStore'

export const SellerProductListPage: React.FC = () => {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const actionParam = searchParams.get('action')
  const tabParam = searchParams.get('tab')

  const [shopId, setShopId] = useState<string>('')
  const [categories, setCategories] = useState<ProductCategoryOption[]>([])
  const [allProducts, setAllProducts] = useState<SellerProductItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Filter state
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE' | 'SOLD_OUT' | 'VIOLATION' | 'DELISTED' | 'UNPUBLISHED'>(
    tabParam === 'VIOLATION' ? 'VIOLATION' : 'ALL'
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [stockMin, setStockMin] = useState<string>('')
  const [stockMax, setStockMax] = useState<string>('')
  const [salesMin, setSalesMin] = useState<string>('')
  const [salesMax, setSalesMax] = useState<string>('')

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(actionParam === 'new')
  const [editingProduct, setEditingProduct] = useState<SellerProductItem | null>(null)

  // Batch tools menu
  const [batchMenuOpen, setBatchMenuOpen] = useState<boolean>(false)
  const batchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (batchRef.current && !batchRef.current.contains(e.target as Node)) {
        setBatchMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lắng nghe URL params action để đóng/mở modal
  useEffect(() => {
    if (actionParam === 'new') {
      setEditingProduct(null)
      setIsModalOpen(true)
    } else {
      setIsModalOpen(false)
      setEditingProduct(null)
    }
  }, [actionParam])

  // Lắng nghe URL params tab để đổi tab
  useEffect(() => {
    if (tabParam === 'VIOLATION') {
      setActiveTab('VIOLATION')
    } else if (!tabParam) {
      setActiveTab('ALL')
    }
  }, [tabParam])

  // Lấy shop ID và tải sản phẩm
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      let currentShopId = shopId
      if (!currentShopId) {
        const store = await sellerApi.getMyStore().catch(() => null)
        if (store?.id) {
          currentShopId = store.id
          setShopId(currentShopId)
        } else if (user?.id) {
          const cached = localStorage.getItem(`seller_store_${user.id}`)
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              if (parsed.id) {
                currentShopId = parsed.id
                setShopId(currentShopId)
              }
            } catch {}
          }
        }
      }

      if (currentShopId) {
        const res = await sellerApi.getStoreProducts(currentShopId)
        setAllProducts(res.items || [])
      } else {
        setAllProducts([])
      }
    } catch {
      setAllProducts([])
    } finally {
      setLoading(false)
    }
  }, [shopId, user?.id])

  useEffect(() => {
    sellerApi.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats)
      }
    })
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Filter logic an toàn tuyệt đối, không crash khi thiếu trường
  const displayedProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // Tab filter
      if (activeTab === 'LIVE') {
        if (p.status !== 'ACTIVE' || (p.totalStock ?? 0) <= 0) return false
      } else if (activeTab === 'SOLD_OUT') {
        const isSoldOut = (p.totalStock ?? 0) <= 0 || p.status === 'OUT_OF_STOCK'
        if (!isSoldOut) return false
      } else if (activeTab === 'VIOLATION') {
        if (p.status !== 'PENDING_APPROVAL') return false
      } else if (activeTab === 'DELISTED') {
        if (p.status !== 'INACTIVE') return false
      }

      // Category filter
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = (p.name || '').toLowerCase().includes(q)
        const matchesDesc = (p.description || '').toLowerCase().includes(q)
        if (!matchesName && !matchesDesc) return false
      }

      // Stock filter
      if (stockMin && p.totalStock < parseInt(stockMin, 10)) return false
      if (stockMax && p.totalStock > parseInt(stockMax, 10)) return false

      return true
    })
  }, [allProducts, activeTab, selectedCategory, searchQuery, stockMin, stockMax])

  const handleTabChange = (t: 'ALL' | 'LIVE' | 'SOLD_OUT' | 'VIOLATION' | 'DELISTED' | 'UNPUBLISHED') => {
    setActiveTab(t)
    const newParams = new URLSearchParams(searchParams)
    if (t === 'ALL') {
      newParams.delete('tab')
    } else {
      newParams.set('tab', t)
    }
    setSearchParams(newParams)
  }

  const handleResetFilter = () => {
    setSearchQuery('')
    setSelectedCategory('ALL')
    setStockMin('')
    setStockMax('')
    setSalesMin('')
    setSalesMax('')
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('action', 'new')
    setSearchParams(newParams)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('action')
    setSearchParams(newParams)
  }

  const handleOpenEditModal = async (product: SellerProductItem) => {
    let currentShopId = shopId
    if (!currentShopId) {
      const store = await sellerApi.getMyStore()
      if (store) {
        currentShopId = store.id
        setShopId(currentShopId)
      }
    }

    if (currentShopId) {
      try {
        const fullDetail = await sellerApi.getStoreProductDetail(currentShopId, product.id)
        if (fullDetail) {
          setEditingProduct(fullDetail)
          setIsModalOpen(true)
          return
        }
      } catch (err) {
        console.error('Error fetching full product detail:', err)
      }
    }

    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleModalSuccess = (saved: SellerProductItem) => {
    toast.success(editingProduct ? `Cập nhật "${saved.name}" thành công!` : `Thêm "${saved.name}" thành công!`)
    handleCloseModal()
    loadProducts()
  }

  const handleDeleteProduct = async (productId: string) => {
    let currentShopId = shopId
    if (!currentShopId) {
      const store = await sellerApi.getMyStore()
      if (store) {
        currentShopId = store.id
        setShopId(currentShopId)
      }
    }
    if (!currentShopId) return

    try {
      await sellerApi.deleteStoreProduct(currentShopId, productId)
      toast.success('Đã xóa sản phẩm khỏi gian hàng.')
      loadProducts()
    } catch {
      toast.error('Không thể xóa sản phẩm.')
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedProducts.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  // Tải danh sách sản phẩm thành file CSV thật
  const handleExportProductsCsv = () => {
    if (displayedProducts.length === 0) {
      toast.info('Không có sản phẩm nào để xuất dữ liệu.')
      return
    }
    const headers = ['Mã sản phẩm', 'Tên sản phẩm', 'Danh mục', 'Giá bán (VNĐ)', 'Tồn kho', 'Trạng thái']
    const rows = displayedProducts.map((p) => [
      `"${p.id || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.categoryName || ''}"`,
      `"${p.minPriceMinor || 0}"`,
      `"${p.totalStock || 0}"`,
      `"${p.status || ''}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `chickymart_products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Đã xuất thành công ${displayedProducts.length} sản phẩm ra file CSV!`)
  }

  // Xóa các sản phẩm đã chọn
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.info('Vui lòng chọn ít nhất 1 sản phẩm để thực hiện.')
      return
    }
    let currentShopId = shopId
    if (!currentShopId) {
      const store = await sellerApi.getMyStore()
      if (store) {
        currentShopId = store.id
        setShopId(currentShopId)
      }
    }
    if (!currentShopId) return

    let successCount = 0
    for (const id of selectedIds) {
      try {
        await sellerApi.deleteStoreProduct(currentShopId, id)
        successCount++
      } catch {}
    }
    toast.success(`Đã xóa thành công ${successCount} sản phẩm!`)
    setSelectedIds([])
    loadProducts()
  }

  const liveCount = useMemo(() => {
    return allProducts.filter((p) => p.status === 'ACTIVE' && (p.totalStock ?? 0) > 0).length
  }, [allProducts])

  const soldOutCount = useMemo(() => {
    return allProducts.filter((p) => (p.totalStock ?? 0) <= 0 || p.status === 'OUT_OF_STOCK').length
  }, [allProducts])

  const violationCount = useMemo(() => {
    return allProducts.filter((p) => p.status === 'PENDING_APPROVAL').length
  }, [allProducts])

  const delistedCount = useMemo(() => {
    return allProducts.filter((p) => p.status === 'INACTIVE').length
  }, [allProducts])

  const PRODUCT_TABS = useMemo(() => [
    { id: 'ALL', label: `All (${allProducts.length})` },
    { id: 'LIVE', label: `Live (${liveCount})` },
    { id: 'SOLD_OUT', label: `Sold out (${soldOutCount})` },
    { id: 'VIOLATION', label: `Violation (${violationCount})` },
    { id: 'DELISTED', label: `Delisted (${delistedCount})` },
    { id: 'UNPUBLISHED', label: 'Unpublished (0)' },
  ], [allProducts.length, liveCount, soldOutCount, violationCount, delistedCount])

  const tabStatusSubtitle = useMemo(() => {
    switch (activeTab) {
      case 'LIVE':
        return 'Ready to sell'
      case 'SOLD_OUT':
        return 'Out of stock'
      case 'VIOLATION':
        return 'Pending approval / Violation'
      case 'DELISTED':
        return 'Delisted / Hidden'
      case 'UNPUBLISHED':
        return 'Draft / Unpublished'
      default:
        return 'All store products'
    }
  }, [activeTab])

  return (
    <SellerLayout>
      <div style={{ padding: '20px 24px', backgroundColor: '#f6f6f6', minHeight: 'calc(100vh - 64px)' }}>
        {/* ── 1. FILTER BOX ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 4,
            border: '1px solid #e8e8e8',
            padding: '20px 24px',
            marginBottom: 16,
          }}
        >
          {/* Row 1: Product Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 }}>
            {/* Product Name */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  padding: '7px 12px',
                  border: '1px solid #d9d9d9',
                  borderRight: 'none',
                  borderRadius: '4px 0 0 4px',
                  backgroundColor: '#fafafa',
                  fontSize: 13,
                  color: '#595959',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Product Name</span>
                <ChevronDown style={{ width: 12, height: 12 }} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Input product name"
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '0 4px 4px 0',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Category */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  padding: '7px 12px',
                  border: '1px solid #d9d9d9',
                  borderRight: 'none',
                  borderRadius: '4px 0 0 4px',
                  backgroundColor: '#fafafa',
                  fontSize: 13,
                  color: '#595959',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Category</span>
              </div>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 32px 7px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '0 4px 4px 0',
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">Choose Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Edit3
                  style={{
                    width: 14,
                    height: 14,
                    color: '#8c8c8c',
                    position: 'absolute',
                    right: 10,
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Stock, Sales, Search & Reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {/* Stock Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', width: 44 }}>Stock</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={stockMin}
                  onChange={(e) => setStockMin(e.target.value)}
                  style={{ width: 80, padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}
                />
                <span style={{ color: '#8c8c8c' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={stockMax}
                  onChange={(e) => setStockMax(e.target.value)}
                  style={{ width: 80, padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}
                />
              </div>

              {/* Sales Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', width: 44 }}>Sales</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={salesMin}
                  onChange={(e) => setSalesMin(e.target.value)}
                  style={{ width: 80, padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}
                />
                <span style={{ color: '#8c8c8c' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={salesMax}
                  onChange={(e) => setSalesMax(e.target.value)}
                  style={{ width: 80, padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}
                />
              </div>
            </div>

            {/* Search & Reset Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={loadProducts}
                style={{
                  backgroundColor: '#facc15',
                  border: 'none',
                  color: '#0f172a',
                  padding: '7px 24px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d9d9d9',
                  color: '#595959',
                  padding: '7px 20px',
                  borderRadius: 4,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. TABS & TABLE CARD ── */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
          {/* Tabs bar */}
          <div
            style={{
              borderBottom: '1px solid #e8e8e8',
              display: 'flex',
              padding: '0 20px',
              gap: 28,
              overflowX: 'auto',
            }}
          >
            {PRODUCT_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as any)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '16px 4px',
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ca8a04' : '#595959',
                    cursor: 'pointer',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        backgroundColor: '#eab308',
                        borderRadius: '2px 2px 0 0',
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Action Row */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>
                {displayedProducts.length} Products
              </span>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>•</span>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>{tabStatusSubtitle}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={handleOpenAddModal}
                style={{
                  backgroundColor: '#facc15',
                  border: 'none',
                  color: '#0f172a',
                  padding: '7px 18px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus style={{ width: 15, height: 15 }} />
                <span>Add a New Product</span>
              </button>

              {/* Batch Tools Dropdown */}
              <div style={{ position: 'relative' }} ref={batchRef}>
                <button
                  type="button"
                  onClick={() => setBatchMenuOpen(!batchMenuOpen)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d9d9d9',
                    color: '#595959',
                    padding: '7px 14px',
                    borderRadius: 4,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>Batch Tools</span>
                  <ChevronDown style={{ width: 12, height: 12 }} />
                </button>

                {batchMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      padding: 4,
                      width: 200,
                      zIndex: 50,
                    }}
                  >
                    <div
                      onClick={() => {
                        setBatchMenuOpen(false)
                        handleExportProductsCsv()
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: 12,
                        color: '#334155',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Download style={{ width: 14, height: 14, color: '#0284c7' }} />
                      <span>Xuất danh sách (CSV)</span>
                    </div>

                    <div
                      onClick={() => {
                        setBatchMenuOpen(false)
                        handleBatchDelete()
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: 12,
                        color: '#dc2626',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                      <span>Xóa các mục đã chọn</span>
                    </div>
                  </div>
                )}
              </div>

              {/* View mode toggle */}
              <div style={{ display: 'flex', border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{
                    background: viewMode === 'list' ? '#fefce8' : '#ffffff',
                    border: 'none',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: viewMode === 'list' ? '#ca8a04' : '#8c8c8c',
                  }}
                >
                  <LayoutList style={{ width: 15, height: 15 }} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    background: viewMode === 'grid' ? '#fefce8' : '#ffffff',
                    border: 'none',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: viewMode === 'grid' ? '#ca8a04' : '#8c8c8c',
                  }}
                >
                  <LayoutGrid style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area: List vs Grid */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#8c8c8c' }}>
              <Loader2 style={{ width: 28, height: 28, animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, margin: 0 }}>Loading products...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <Package style={{ width: 48, height: 48, color: '#d9d9d9', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                Không tìm thấy sản phẩm nào
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400, margin: '0 auto 16px' }}>
                Gian hàng chưa có sản phẩm trong mục này. Bấm vào nút bên dưới để thêm sản phẩm đầu tiên của bạn!
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                style={{
                  backgroundColor: '#facc15',
                  border: 'none',
                  color: '#0f172a',
                  padding: '8px 22px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus style={{ width: 15, height: 15 }} />
                <span>Thêm sản phẩm mới ngay</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {displayedProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id)
                const priceDisplay =
                  p.minPriceMinor === p.maxPriceMinor
                    ? formatMoney(p.minPriceMinor || 0)
                    : `${formatMoney(p.minPriceMinor || 0)} - ${formatMoney(p.maxPriceMinor || 0)}`
                const img = p.thumbnailUrl || p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'

                return (
                  <div
                    key={p.id}
                    style={{
                      border: isSelected ? '2px solid #eab308' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      overflow: 'hidden',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: 160, backgroundColor: '#f8fafc' }}>
                      <img
                        src={img}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: 8, left: 8 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p.id)}
                          style={{ width: 16, height: 16, accentColor: '#eab308', cursor: 'pointer' }}
                        />
                      </div>
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <span
                          style={{
                            backgroundColor: p.status === 'ACTIVE' ? '#dcfce7' : '#fef9c3',
                            color: p.status === 'ACTIVE' ? '#166534' : '#854d0e',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 10,
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 6, lineHeight: 1.3, height: 34, overflow: 'hidden' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#ca8a04', marginBottom: 4 }}>
                        {priceDisplay}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                        Kho: <strong>{p.totalStock}</strong>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#2563eb',
                            cursor: 'pointer',
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ── LIST VIEW (Mặc định chuẩn Ảnh 4) ── */
            <div>
              {/* Table Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 3.5fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr 1.2fr',
                  backgroundColor: '#fafafa',
                  padding: '12px 18px',
                  borderBottom: '1px solid #e8e8e8',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#595959',
                  alignItems: 'center',
                }}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={displayedProducts.length > 0 && selectedIds.length === displayedProducts.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div>Product Name</div>
                <div>SKU</div>
                <div>Variations</div>
                <div>Price</div>
                <div>Stock</div>
                <div>Sales</div>
                <div style={{ textAlign: 'right' }}>Options</div>
              </div>

              {/* Table Body */}
              <div>
                {displayedProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id)
                  const priceDisplay =
                    p.minPriceMinor === p.maxPriceMinor
                      ? formatMoney(p.minPriceMinor || 0)
                      : `${formatMoney(p.minPriceMinor || 0)} - ${formatMoney(p.maxPriceMinor || 0)}`
                  const img = p.thumbnailUrl || p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'

                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 3.5fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr 1.2fr',
                        padding: '16px 18px',
                        borderBottom: '1px solid #f0f0f0',
                        alignItems: 'center',
                        fontSize: 13,
                        backgroundColor: isSelected ? '#fefce8' : '#ffffff',
                      }}
                    >
                      {/* Checkbox */}
                      <div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>

                      {/* Product Name & Stats */}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img
                          src={img}
                          alt={p.name || ''}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#262626', marginBottom: 4, lineHeight: 1.3 }}>
                            {p.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#8c8c8c' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Eye style={{ width: 12, height: 12 }} /> 62
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Heart style={{ width: 12, height: 12 }} /> 2
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SKU */}
                      <div style={{ color: '#595959', fontSize: 12 }}>
                        {p.id ? p.id.slice(0, 8).toUpperCase() : 'N/A'}
                      </div>

                      {/* Variations */}
                      <div style={{ color: '#595959', fontSize: 12 }}>
                        {p.variants && p.variants.length > 0 ? `${p.variants.length} Phân loại` : 'Mặc định'}
                      </div>

                      {/* Price */}
                      <div style={{ fontWeight: 700, color: '#ca8a04' }}>
                        {priceDisplay}
                      </div>

                      {/* Stock */}
                      <div style={{ fontWeight: 600, color: p.totalStock > 0 ? '#262626' : '#dc2626' }}>
                        {p.totalStock}
                      </div>

                      {/* Sales */}
                      <div style={{ color: '#595959' }}>
                        0
                      </div>

                      {/* Options */}
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                        <span
                          style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => handleOpenEditModal(p)}
                        >
                          Edit
                        </span>
                        <span
                          style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 500 }}
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          Delete
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal thêm/sửa sản phẩm */}
        {isModalOpen && (
          <ProductFormModal
            isOpen={isModalOpen}
            shopId={shopId}
            initialProduct={editingProduct}
            onClose={handleCloseModal}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </SellerLayout>
  )
}

export default SellerProductListPage
