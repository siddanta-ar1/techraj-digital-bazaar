'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Shield, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/types/product'
import { useCart } from '@/contexts/CartContext'
import { ProductVariantSelector } from './ProductVariantSelector'

interface ProductDetailProps {
  product: Product & {
    category?: any
    variants?: any[]
    reviews?: { count: number }[]
  }
}

// Add this function at the top of the file
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '/images/placeholder-product.jpg'
  
  // Fix Unsplash URLs
  if (url.includes('unsplash.com') && url.includes('?w=')) {
    // Remove problematic parameters and add proper ones
    const baseUrl = url.split('?')[0]
    return `${baseUrl}?auto=format&fit=crop&w=800&q=80`
  }
  
  return url
}


export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0])
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const { addItem } = useCart()
  

  
  const allImages = [product.featured_image, ...(product.gallery_images || [])]
    .filter(Boolean) as string[]

  const handleAddToCart = () => {
    if (!selectedVariant) return

    addItem({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.variant_name,
      price: selectedVariant.price,
      imageUrl: product.featured_image
    })
  }

  const discount = selectedVariant?.original_price 
    ? Math.round(((selectedVariant.original_price - selectedVariant.price) / selectedVariant.original_price) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left Column - Images */}
      <div>
        {/* Main Image */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-4 relative overflow-hidden group">
          {discount > 0 && (
            <div className="absolute top-4 right-4 z-10 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {discount}% OFF
            </div>
          )}
          
          <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-4 relative overflow-hidden group">
  {discount > 0 && (
    <div className="absolute top-4 right-4 z-10 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold">
      {discount}% OFF
    </div>
  )}
  </div>
  
  <div className="aspect-square relative">
    <Image
      src={getImageUrl(allImages[activeImageIndex])}
      alt={product.name}
      fill
      className="object-contain group-hover:scale-105 transition-transform duration-300"
      sizes="(max-width: 768px) 100vw, 50vw"
      priority
      unoptimized={allImages[activeImageIndex]?.includes('unsplash.com')}
    />
  </div>

          {/* Image Navigation */}
          {allImages.length > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4">
              <button
                onClick={() => setActiveImageIndex(prev => (prev - 1 + allImages.length) % allImages.length)}
                className="bg-white/80 hover:bg-white text-slate-700 p-2 rounded-full shadow-lg backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveImageIndex(prev => (prev + 1) % allImages.length)}
                className="bg-white/80 hover:bg-white text-slate-700 p-2 rounded-full shadow-lg backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                  activeImageIndex === index 
                    ? 'border-indigo-600 ring-2 ring-indigo-200' 
                    : 'border-slate-200'
                }`}
              >
                <div className="w-full h-full bg-slate-100 relative">
                  <Image
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column - Product Info */}
      <div>
        {/* Category Badge */}
        {product.category && (
          <div className="inline-block mb-4">
            <span className="bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
              {product.category.name}
            </span>
          </div>
        )}

        {/* Product Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          {product.name}
        </h1>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-slate-600">4.8</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <span className="text-sm text-slate-600">
            {product.reviews?.[0]?.count || 0} reviews
          </span>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-1 text-sm text-emerald-600">
            <Zap className="w-4 h-4" />
            <span>20+ sold today</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-bold text-indigo-700">
              रु {selectedVariant?.price.toFixed(2) || '0.00'}
            </span>
            {selectedVariant?.original_price && (
              <span className="text-xl text-slate-500 line-through">
                रु {selectedVariant.original_price.toFixed(2)}
              </span>
            )}
            {discount > 0 && (
              <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-sm font-bold">
                Save {discount}%
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">All prices include VAT</p>
        </div>

        {/* Variant Selection */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Select Option:
            </h3>
            <ProductVariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onSelect={setSelectedVariant}
            />
          </div>
        )}

        {/* Quantity & Add to Cart */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden w-fit">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-4 py-3 text-slate-600 hover:bg-slate-50"
              >
                -
              </button>
              <span className="px-6 py-3 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-4 py-3 text-slate-600 hover:bg-slate-50"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || (selectedVariant.stock_quantity === 0 && selectedVariant.stock_type === 'limited')}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-5 h-5" />
              {!selectedVariant || (selectedVariant.stock_quantity === 0 && selectedVariant.stock_type === 'limited')
                ? 'OUT OF STOCK'
                : 'ADD TO CART'}
            </button>

            {/* Buy Now Button */}
            <button
              onClick={handleAddToCart}
              className="flex-1 border-2 border-indigo-600 text-indigo-600 py-3 px-8 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
            >
              BUY NOW
            </button>
          </div>
        </div>

        {/* Quick Features */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Instant Delivery</p>
              <p className="text-sm text-slate-600">Within 5 minutes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">100% Secure</p>
              <p className="text-sm text-slate-600">Payment protection</p>
            </div>
          </div>
        </div>

        {/* Stock Status */}
        {selectedVariant && (
          <div className="mb-6">
            {selectedVariant.stock_type === 'limited' && selectedVariant.stock_quantity > 0 && (
              <div className="text-sm text-slate-700">
                <span className="font-medium">Stock:</span>{' '}
                <span className="text-emerald-600 font-bold">
                  {selectedVariant.stock_quantity} available
                </span>
                {selectedVariant.stock_quantity < 10 && (
                  <span className="ml-2 text-amber-600">(Low stock!)</span>
                )}
              </div>
            )}
            {selectedVariant.stock_type === 'unlimited' && (
              <div className="text-sm text-slate-700">
                <span className="font-medium">Stock:</span>{' '}
                <span className="text-emerald-600 font-bold">Unlimited</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}