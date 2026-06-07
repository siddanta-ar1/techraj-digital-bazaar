"use client";

import { ShoppingCart, Zap, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { BLUR_PLACEHOLDER } from "@/lib/imagePlaceholder";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [cartState, setCartState] = useState<"idle" | "added">("idle");
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  useEffect(() => () => { if (addedTimerRef.current) clearTimeout(addedTimerRef.current); }, []);

  const mainVariant = product.variants?.[0];
  const isOutOfStock =
    mainVariant?.stock_type === "limited" && mainVariant.stock_quantity <= 0;
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mainVariant || cartState === "added") return;

    if (isOutOfStock) {
      setShowOutOfStockModal(true);
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      variantId: mainVariant.id,
      variantName: mainVariant.variant_name,
      price: mainVariant.price,
      imageUrl: product.featured_image,
    });
    setCartState("added");
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setCartState("idle"), 1500);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col bg-white rounded-xl md:rounded-2xl overflow-hidden border border-slate-200 h-full animate-fade-up
                 shadow-[0_1px_3px_0_rgb(0_0_0/0.1)]
                 transition-all duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)]
                 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_rgb(99_102_241/0.25)] hover:border-indigo-300"
    >
      {/* Badges & Image Container */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {/* Badges - Adjusted for mobile */}
        {product.is_featured && (
          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 shrink-0" />
            <span>FEATURED</span>
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
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
        <h3 className="font-bold text-sm md:text-base text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2 mb-1 md:mb-2 grow">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="mt-auto pt-2 md:pt-4 border-t border-slate-50 flex items-end justify-between gap-2">
          <div>
            {mainVariant && (
              <div className="flex flex-col">
                <span className="text-base md:text-lg font-bold text-indigo-700">
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart(e);
            }}
            disabled={!mainVariant || isOutOfStock || cartState === "added"}
            className={`text-white rounded-xl shrink-0 relative z-10 shadow-sm min-w-11 min-h-11 flex items-center justify-center transition-colors duration-200
              ${cartState === "added"
                ? "bg-green-600 shadow-green-100 cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 disabled:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            aria-label={
              cartState === "added"
                ? "Added to cart"
                : isOutOfStock
                ? `${product.name} is out of stock`
                : `Add ${product.name} to cart`
            }
          >
            {cartState === "added" ? (
              <Check className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Out of Stock Modal */}
      <Modal
        isOpen={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        type="warning"
        title="Out of Stock"
        message="This product is currently out of stock and is not available for purchase."
        confirmText="OK"
        showConfirmButton={true}
        onConfirm={() => setShowOutOfStockModal(false)}
        autoClose={true}
        autoCloseDelay={4000}
      />
    </Link>
  );
}
