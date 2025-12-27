'use client'

import { ShoppingCart, Star, Shield, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types/product'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [addingToCart, setAddingToCart] = useState(false)
  
  const mainVariant = product.variants?.[0]
  const hasDiscount = mainVariant?.original_price && mainVariant.original_price > mainVariant.price
  const discountPercentage = hasDiscount && mainVariant 
    ? Math.round(((mainVariant.original_price - mainVariant.price) / mainVariant.original_price) * 100)
    : 0

  const handleAddToCart = async () => {
    if (!mainVariant) return
    
    setAddingToCart(true)
    try {
      addItem({
        productId: product.id,
        productName: product.name,
        variantId: mainVariant.id,
        variantName: mainVariant.variant_name,
        price: mainVariant.price,
        imageUrl: product.featured_image
      })
      
      // Optional: Show toast notification
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-indigo-300">
      {/* Badges */}
      <div className="relative">
        {product.is_featured && (
          <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Zap className="w-3 h-3" />
            FEATURED
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-3 right-3 z-10 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            {discountPercentage}% OFF
          </div>
        )}

        {/* Product Image */}
        <Link href={`/products/${product.slug}`} className="block">
          <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
            {product.featured_image ? (
              <div className="w-full h-full relative">
                <Image
                  src={product.featured_image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎮</div>
                  <p className="text-sm font-medium">No Image</p>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Category */}
        {product.category && (
          <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-2">
            {product.category.name}
          </span>
        )}

        {/* Product Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 min-h-[40px]">
          {product.description || 'Digital product with instant delivery'}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-2">(4.5)</span>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {mainVariant && (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-indigo-700">
                  रु {mainVariant.price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-500 line-through">
                    रु {mainVariant.original_price!.toFixed(2)}
                  </span>
                )}
              </div>
            )}
            {product.requires_manual_delivery && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <Shield className="w-3 h-3" />
                Manual Delivery
              </div>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !mainVariant || mainVariant.stock_quantity === 0}
            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-indigo-100"
          >
            {addingToCart ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mainVariant?.stock_quantity === 0 ? (
              <span className="text-xs font-medium">OUT OF STOCK</span>
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}