// src/app/(shop)/cart/page.tsx
import { Metadata } from 'next'
import { ShoppingCart } from 'lucide-react'

import { Suspense } from 'react'
import CartClient from './CartClient'

export const metadata: Metadata = {
  title: 'Shopping Cart - Tronline Bazar',
  description: 'Review and manage your shopping cart',
}

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-indigo-600" />
          Shopping Cart
        </h1>
        <p className="text-slate-600 mt-2">Review your items and proceed to checkout</p>
      </div>

      <Suspense fallback={<CartLoadingSkeleton />}>
        <CartClient />
      </Suspense>
    </div>
  )
}

function CartLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-slate-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-6 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}