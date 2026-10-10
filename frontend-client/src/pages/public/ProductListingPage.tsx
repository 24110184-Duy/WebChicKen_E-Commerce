import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { ProductCard } from '../../components/molecules/ProductCard'
import { catalogApi } from '../../features/catalog/api/catalogApi'
import type { Category } from '../../features/catalog/types/catalogTypes'
import type { Product, ProductFilter } from '../../features/catalog/types/catalogTypes'
import { PATHS } from '../../app/router/paths'
import { AmazonDualSlider } from '../../features/catalog/components/AmazonDualSlider'
import { formatMoney } from '../../shared/lib/formatMoney'

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCategory = searchParams.get('categoryId') || ''
  const storeId = searchParams.get('storeId') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    catalogApi.getCategories().then(setCategories)
  }, [])

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [minRating, setMinRating] = useState<number>(0)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2900000])
  const [discountRange, setDiscountRange] = useState<[number, number]>([0, 100])
  const [sort, setSort] = useState<ProductFilter['sort']>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 24

  useEffect(() => {
    setSelectedCategory(searchParams.get('categoryId') || '')
  }, [searchParams])

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      const filter: ProductFilter = {
        query: searchParams.get('q') || undefined,
        categoryId: selectedCategory || undefined,
        storeId: storeId || undefined,
        sort,
        page: currentPage,
        size: pageSize,
      }
      const res = await catalogApi.getProducts(filter)
      setProducts(res.items)
      setTotal(res.total)
      setIsLoading(false)
    }

    fetchProducts()
  }, [searchParams, selectedCategory, storeId, sort, currentPage])

  // Calculate dynamic maximum price ceiling
  const maxPriceCeil = useMemo(() => {
    if (products.length === 0) return 2900000
    const max = Math.max(...products.map(p => p.maxPriceMinor || p.minPriceMinor || 0))
    return Math.max(2900000, Math.ceil(max / 100000) * 100000)
  }, [products])

  // Sync price ceiling if products max exceeds default
  useEffect(() => {
    if (maxPriceCeil > 2900000 && priceRange[1] === 2900000) {
      setPriceRange([priceRange[0], maxPriceCeil])
    }
  }, [maxPriceCeil])

  // Client-side filtering for instant response on slider and rating changes
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Rating
      if (minRating > 0 && (p.rating || 5) < minRating) return false

      // 2. Price
      const price = p.minPriceMinor || 0
      if (price < priceRange[0] || price > priceRange[1]) return false

      // 3. Discount
      const disc = p.discountPercent || 0
      if (discountRange[0] > 0 || discountRange[1] < 100) {
        if (disc < discountRange[0] || disc > discountRange[1]) return false
      }

      return true
    })
  }, [products, minRating, priceRange, discountRange])

  const handleClearFilters = () => {
    setSelectedCategory('')
    setMinRating(0)
    setPriceRange([0, maxPriceCeil])
    setDiscountRange([0, 100])
    setSort('newest')
    setCurrentPage(1)
    setSearchParams({})
  }

  const hasActiveFilters = Boolean(
    selectedCategory ||
    minRating > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPriceCeil ||
    discountRange[0] > 0 ||
    discountRange[1] < 100 ||
    searchParams.get('q')
  )

  const queryText = searchParams.get('q')
  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <StorefrontLayout>
      <div className="plp-page">
        {/* Breadcrumbs */}
        <div className="plp-breadcrumbs">
          <Link to={PATHS.HOME}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>Products</span>
          {queryText && (
            <>
              <span style={{ margin: '0 8px' }}>/</span>
              <span>Search: "{queryText}"</span>
            </>
          )}
        </div>

        <div className="plp-layout">
          {/* Left Sidebar Filters */}
          <aside className="plp-sidebar">
            <div className="plp-filter-title">
              <span>Filter Options</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="plp-filter-group">
              <div className="plp-group-title">Categories</div>
              <div className="plp-filter-list">
                <label className="plp-filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={!selectedCategory}
                    onChange={() => {
                      setSelectedCategory('')
                      setCurrentPage(1)
                    }}
                  />
                  <span>All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="plp-filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.id}
                      onChange={() => {
                        setSelectedCategory(cat.id)
                        setCurrentPage(1)
                      }}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Customer Reviews */}
            <div className="amazon-filter-block">
              <div className="amazon-filter-title">Customer Reviews</div>
              <div className="amazon-review-list">
                {/* Option 1: All */}
                <div
                  className="amazon-review-option"
                  onClick={() => {
                    setMinRating(0)
                    setCurrentPage(1)
                  }}
                >
                  <div className={`amazon-review-radio ${minRating === 0 ? 'selected' : ''}`} />
                  <span className="amazon-review-label">All</span>
                </div>

                {/* Option 2: 4 stars & up */}
                <div
                  className="amazon-review-option"
                  onClick={() => {
                    setMinRating(minRating === 4 ? 0 : 4)
                    setCurrentPage(1)
                  }}
                >
                  <div className={`amazon-review-radio ${minRating === 4 ? 'selected' : ''}`} />
                  <div className="amazon-stars-row">
                    <svg className="amazon-star-svg" viewBox="0 0 24 24" fill="#de7921">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <svg className="amazon-star-svg" viewBox="0 0 24 24" fill="#de7921">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <svg className="amazon-star-svg" viewBox="0 0 24 24" fill="#de7921">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <svg className="amazon-star-svg" viewBox="0 0 24 24" fill="#de7921">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <svg className="amazon-star-svg" viewBox="0 0 24 24" fill="none" stroke="#de7921" strokeWidth="1.6">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span className="amazon-up-text">& up</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="amazon-filter-block">
              <div className="amazon-filter-title">Price</div>
              <div className="amazon-filter-value">
                {formatMoney(priceRange[0])} – {formatMoney(priceRange[1])}
              </div>
              <AmazonDualSlider
                min={0}
                max={maxPriceCeil}
                step={50000}
                value={priceRange}
                onChange={(val) => {
                  setPriceRange(val)
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* Discount */}
            <div className="amazon-filter-block">
              <div className="amazon-filter-title">Discount</div>
              <div className="amazon-filter-value">
                {discountRange[0]}% – {discountRange[1]}%
              </div>
              <AmazonDualSlider
                min={0}
                max={100}
                step={5}
                value={discountRange}
                onChange={(val) => {
                  setDiscountRange(val)
                  setCurrentPage(1)
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="plp-filter-btn-clear"
              style={{ marginTop: 20 }}
            >
              Clear All Filters
            </button>
          </aside>

          {/* Right Main Results */}
          <main style={{ minWidth: 0 }}>
            <div className="plp-main-bar">
              <div className="plp-result-count">
                Found <strong>{displayedProducts.length}</strong> products
                {queryText && <span> for "<strong>{queryText}</strong>"</span>}
              </div>

              <div className="plp-sort-wrap">
                <span className="plp-sort-label">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="plp-sort-select"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="popular">Most Popular</option>
                  <option value="top_rated">Top Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>
                Loading fresh products...
              </div>
            ) : displayedProducts.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid #f1f5f9',
                borderRadius: 10,
                padding: '80px 20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  No products found matching your filter
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                  Try broadening your search keyword or adjusting the price & discount sliders.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    padding: '8px 22px',
                    background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                    color: '#0f172a',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="plp-grid">
                  {displayedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="plp-pagination">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="plp-page-btn"
                    >
                      &larr; Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`plp-page-btn ${currentPage === p ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="plp-page-btn"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </StorefrontLayout>
  )
}
export default ProductListingPage
