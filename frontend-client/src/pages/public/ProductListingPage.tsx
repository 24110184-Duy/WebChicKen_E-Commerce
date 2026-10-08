import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StorefrontLayout } from '../../layouts/StorefrontLayout'
import { ProductCard } from '../../components/molecules/ProductCard'
import { catalogApi } from '../../features/catalog/api/catalogApi'
import type { Category } from '../../features/catalog/types/catalogTypes'
import type { Product, ProductFilter } from '../../features/catalog/types/catalogTypes'
import { PATHS } from '../../app/router/paths'

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCategory = searchParams.get('categoryId') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    catalogApi.getCategories().then(setCategories)
  }, [])

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sort, setSort] = useState<ProductFilter['sort']>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  useEffect(() => {
    setSelectedCategory(searchParams.get('categoryId') || '')
  }, [searchParams])

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      const filter: ProductFilter = {
        query: searchParams.get('q') || undefined,
        categoryId: selectedCategory || undefined,
        minPriceMinor: minPrice ? Number(minPrice) : undefined,
        maxPriceMinor: maxPrice ? Number(maxPrice) : undefined,
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
  }, [searchParams, selectedCategory, sort, currentPage])

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    // Triggers useEffect
    const filter: ProductFilter = {
      query: searchParams.get('q') || undefined,
      categoryId: selectedCategory || undefined,
      minPriceMinor: minPrice ? Number(minPrice) : undefined,
      maxPriceMinor: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page: 1,
      size: pageSize,
    }
    catalogApi.getProducts(filter).then(res => {
      setProducts(res.items)
      setTotal(res.total)
    })
  }

  const handleClearFilters = () => {
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setCurrentPage(1)
    setSearchParams({})
  }

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
              {(selectedCategory || minPrice || maxPrice || queryText) && (
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

            {/* Price Range */}
            <div className="plp-filter-group">
              <div className="plp-group-title">Price Range (VND)</div>
              <form onSubmit={handleApplyPrice}>
                <div className="plp-price-range-inputs">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min (e.g. 50000)"
                    className="plp-price-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="plp-price-input"
                  />
                </div>
                <button type="submit" className="plp-filter-btn-apply">
                  Apply Filter
                </button>
              </form>
            </div>

            {/* Quality Standard */}
            <div className="plp-filter-group" style={{ borderBottom: 'none' }}>
              <div className="plp-group-title">Certifications</div>
              <div className="plp-filter-list">
                <label className="plp-filter-option">
                  <input type="checkbox" defaultChecked />
                  <span>HACCP Certified</span>
                </label>
                <label className="plp-filter-option">
                  <input type="checkbox" defaultChecked />
                  <span>Free-Range Guaranteed</span>
                </label>
                <label className="plp-filter-option">
                  <input type="checkbox" />
                  <span>100% Organic Pasture</span>
                </label>
              </div>
            </div>

            <button type="button" onClick={handleClearFilters} className="plp-filter-btn-clear">
              Clear All Filters
            </button>
          </aside>

          {/* Right Main Results */}
          <main style={{ minWidth: 0 }}>
            <div className="plp-main-bar">
              <div className="plp-result-count">
                Found <strong>{total}</strong> products
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
            ) : products.length === 0 ? (
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
                  Try broadening your search keyword or clearing the price filters.
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
                  {products.map(product => (
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
