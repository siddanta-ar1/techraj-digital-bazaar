"use client";

import { ShoppingCart, Star, Shield, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const mainVariant = product.variants?.[0];
  const hasDiscount =
    mainVariant?.original_price &&
    mainVariant.original_price > mainVariant.price;

  const discountPercentage =
    hasDiscount && mainVariant
      ? Math.round(
          ((mainVariant.original_price! - mainVariant.price) /
            mainVariant.original_price!) *
            100,
        )
      : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking button
    if (!mainVariant) return;

    setAddingToCart(true);
    try {
      addItem({
        productId: product.id,
        productName: product.name,
        variantId: mainVariant.id,
        variantName: mainVariant.variant_name,
        price: mainVariant.price,
        imageUrl: product.featured_image,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-indigo-300 flex flex-col h-full"
    >
      {/* Badges & Image Container */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {/* Badges - Adjusted for mobile */}
        {product.is_featured && (
          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3" />
            <span className="hidden md:inline">FEATURED</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 right-2 z-10 bg-rose-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full shadow-sm">
            -{discountPercentage}%
          </div>
        )}

        {product.featured_image ? (
          <Image
            src={product.featured_image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <span className="text-2xl">🎮</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Info - Condensed for mobile */}
      <div className="p-3 md:p-5 flex flex-col flex-1">
        {/* Category */}
        <div className="mb-1 md:mb-2">
          {product.category && (
            <span className="inline-block text-[10px] md:text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-sm md:text-base text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2 mb-1 md:mb-2 flex-grow">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="mt-auto pt-2 md:pt-4 border-t border-slate-50 flex items-end justify-between gap-2">
          <div>
            {mainVariant && (
              <div className="flex flex-col">
                <span className="text-sm md:text-xl font-bold text-indigo-700">
                  Rs. {mainVariant.price.toFixed(0)}
                </span>
                {hasDiscount && (
                  <span className="text-[10px] md:text-sm text-slate-400 line-through">
                    Rs. {mainVariant.original_price!.toFixed(0)}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={
              addingToCart || !mainVariant || mainVariant.stock_quantity === 0
            }
            className="bg-indigo-600 text-white p-2 md:p-2.5 rounded-lg md:rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-colors shadow-sm shadow-indigo-100 flex-shrink-0"
          >
            {addingToCart ? (
              <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
