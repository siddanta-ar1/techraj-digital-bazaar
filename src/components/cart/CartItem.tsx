// src/components/cart/CartItem.tsx
'use client'

import { CartItem as CartItemType } from '@/types/cart'
import { Trash2, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
      {/* Product Image */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image
          src={item.imageUrl || '/placeholder-product.jpg'}
          alt={item.productName}
          fill
          className="object-cover rounded-lg"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900">{item.productName}</h3>
        <p className="text-sm text-slate-600 mt-1">{item.variantName}</p>
        <p className="text-lg font-bold text-indigo-600 mt-2">
          Rs. {item.price.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="p-1 rounded-full hover:bg-slate-100"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4 text-slate-600" />
        </button>
        
        <span className="w-12 text-center font-medium">{item.quantity}</span>
        
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="p-1 rounded-full hover:bg-slate-100"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      {/* Total & Remove */}
      <div className="text-right">
        <p className="text-lg font-bold text-slate-900">
          Rs. {(item.price * item.quantity).toFixed(2)}
        </p>
        <button
          onClick={() => removeItem(item.id)}
          className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  )
}