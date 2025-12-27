'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

interface BreadcrumbProps {
  category?: {
    id: string
    name: string
    slug: string
  }
  product: {
    name: string
  }
}

export function Breadcrumb({ category, product }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-slate-600">
      <Link 
        href="/" 
        className="flex items-center hover:text-indigo-600 transition-colors"
      >
        <Home className="w-4 h-4 mr-1" />
        Home
      </Link>
      
      <ChevronRight className="w-4 h-4 mx-2" />
      
      <Link 
        href="/products" 
        className="hover:text-indigo-600 transition-colors"
      >
        Products
      </Link>
      
      {category && (
        <>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link 
            href={`/products?category=${category.id}`}
            className="hover:text-indigo-600 transition-colors"
          >
            {category.name}
          </Link>
        </>
      )}
      
      <ChevronRight className="w-4 h-4 mx-2" />
      
      <span className="font-medium text-slate-900 truncate max-w-[200px]">
        {product.name}
      </span>
    </nav>
  )
}