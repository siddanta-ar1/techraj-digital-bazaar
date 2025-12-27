// src/app/(shop)/cart/CartClient.tsx
'use client'

import { useCart } from '@/contexts/CartContext'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import EmptyCart from '@/components/cart/EmptyCart'

export default function CartClient() {
  const { items, totalItems, totalPrice } = useCart()

  if (items.length === 0) {
    return <EmptyCart />
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow divide-y">
          {items.map(item => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <Link
            href="/products"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
          <button
            onClick={() => {/* Clear cart function */}}
            className="text-slate-500 hover:text-red-600 text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <CartSummary />
        
        {/* Trust Badges */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Secure Checkout</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-green-600 text-sm font-medium mb-1">SSL Secure</div>
              <div className="text-xs text-slate-500">256-bit Encryption</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-blue-600 text-sm font-medium mb-1">Easy Refund</div>
              <div className="text-xs text-slate-500">24-hour Guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}