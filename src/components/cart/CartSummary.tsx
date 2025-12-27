'use client'

import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { ShoppingBag, Wallet, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CartSummary() {
  const { totalPrice, totalItems, items } = useCart()
  const { user } = useAuth()

  const deliveryFee = 0 // Digital products have no delivery fee
  const taxAmount = 0 // Assuming no tax for digital products
  const grandTotal = totalPrice + deliveryFee + taxAmount

  const hasWallet = user?.wallet_balance ? user.wallet_balance >= grandTotal : false

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-indigo-600" />
        Order Summary
      </h2>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal ({totalItems} items)</span>
          <span className="font-medium">Rs. {totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Delivery Fee</span>
          <span className="font-medium">Rs. {deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tax</span>
          <span className="font-medium">Rs. {taxAmount.toFixed(2)}</span>
        </div>
        <div className="pt-3 border-t">
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>Rs. {grandTotal.toFixed(2)}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">All prices in NPR</p>
        </div>
      </div>

      {/* Wallet Balance */}
      {user && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Wallet Balance</span>
            </div>
            <span className="font-bold text-indigo-700">
              Rs. {user.wallet_balance?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          {hasWallet && (
            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Sufficient balance for this purchase</span>
            </div>
          )}
          
          {!hasWallet && totalPrice > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Insufficient wallet balance</span>
            </div>
          )}
        </div>
      )}

      {/* Checkout Button */}
      <Link
        href="/checkout"
        className={`w-full block text-center py-3 px-4 rounded-lg font-semibold transition-colors
          ${items.length === 0
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
      >
        {items.length === 0 ? 'Cart is Empty' : 'Proceed to Checkout'}
      </Link>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-sm text-slate-600 mb-3">Accepted Payment Methods</p>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
            Esewa
          </div>
          <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
            Wallet
          </div>
          <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
            Bank Transfer
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="mt-6 text-xs text-slate-500 space-y-2">
        <p className="flex items-start gap-2">
          <span className="text-green-600">✓</span>
          <span>Secure SSL encryption for all transactions</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="text-green-600">✓</span>
          <span>Instant delivery for auto-delivery products</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="text-green-600">✓</span>
          <span>24/7 customer support via WhatsApp</span>
        </p>
      </div>
    </div>
  )
}