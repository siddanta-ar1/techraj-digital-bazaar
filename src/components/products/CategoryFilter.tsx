'use client'

import { Category } from '@/types/product'
import { ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(true)

  const selectedCategory = searchParams.get('category')

  const handleCategoryClick = (categoryId?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId) {
      params.set('category', categoryId)
    } else {
      params.delete('category')
    }
    params.delete('page') // Reset to page 1
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-4"
      >
        <h3 className="font-bold text-slate-900 text-lg">Categories</h3>
        <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryClick()}
            className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
              !selectedCategory
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Products
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{category.name}</span>
                {category.product_count && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {category.product_count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}