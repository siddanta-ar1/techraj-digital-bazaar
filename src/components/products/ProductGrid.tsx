'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from './ProductCard'
import { Product } from '@/types/product'
import { Loader2, Filter, SlidersHorizontal } from 'lucide-react'

interface ProductGridProps {
  initialProducts?: Product[]
  categoryId?: string
  featured?: boolean
  searchQuery?: string
  showFilters?: boolean
}

export function ProductGrid({ 
  initialProducts = [], 
  categoryId, 
  featured, 
  searchQuery,
  showFilters = true 
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(!initialProducts.length)
  const [filters, setFilters] = useState({
    sortBy: 'newest' as const,
    priceRange: [0, 10000] as [number, number]
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProducts = async (pageNum = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryId) params.set('category', categoryId)
      if (featured) params.set('featured', 'true')
      if (searchQuery) params.set('search', searchQuery)
      params.set('sortBy', filters.sortBy)
      params.set('minPrice', filters.priceRange[0].toString())
      params.set('maxPrice', filters.priceRange[1].toString())
      params.set('page', pageNum.toString())
      params.set('limit', '12')

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products)
        setTotalPages(data.totalPages)
      } else {
        console.error('Failed to fetch products:', data.error)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialProducts.length) {
      fetchProducts(page)
    }
  }, [categoryId, featured, searchQuery, filters, page])

  const handleSortChange = (sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular') => {
    setFilters(prev => ({ ...prev, sortBy }))
    setPage(1)
  }

  if (loading && !products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-600">Loading products...</p>
      </div>
    )
  }

  if (!products.length && !loading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <div className="text-5xl mb-4">🛒</div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
        <p className="text-slate-600 mb-6">Try adjusting your search or filter criteria</p>
        <button
          onClick={() => setFilters({ sortBy: 'newest', priceRange: [0, 10000] })}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Filters</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
              
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Price: </span>
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]] 
                  }))}
                  className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm"
                  placeholder="Min"
                />
                <span> - </span>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: [prev.priceRange[0], parseInt(e.target.value) || 10000] 
                  }))}
                  className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}