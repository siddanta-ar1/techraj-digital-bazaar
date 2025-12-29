"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Zap,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { ProductVariantSelector } from "./ProductVariantSelector";

interface ProductDetailProps {
  product: Product & {
    category?: any;
    variants?: any[];
    reviews?: { count: number }[];
  };
}

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/images/placeholder-product.jpg";
  if (url.includes("unsplash.com")) {
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?auto=format&fit=crop&w=800&q=80`;
  }
  return url;
};

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addItem } = useCart();
  const router = useRouter();

  const allImages = [
    product.featured_image,
    ...(product.gallery_images || []),
  ].filter(Boolean) as string[];

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.variant_name,
      price: selectedVariant.price,
      imageUrl: product.featured_image,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const discount = selectedVariant?.original_price
    ? Math.round(
        ((selectedVariant.original_price - selectedVariant.price) /
          selectedVariant.original_price) *
          100,
      )
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Left Column - Images */}
      <div>
        <div className="relative aspect-square bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mb-4">
          {discount > 0 && (
            <div className="absolute top-4 right-4 z-10 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {discount}% OFF
            </div>
          )}

          <Image
            src={getImageUrl(allImages[activeImageIndex])}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 hover:scale-105"
            priority
          />

          {allImages.length > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
              <button
                onClick={() =>
                  setActiveImageIndex(
                    (prev) => (prev - 1 + allImages.length) % allImages.length,
                  )
                }
                className="bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <button
                onClick={() =>
                  setActiveImageIndex((prev) => (prev + 1) % allImages.length)
                }
                className="bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          )}
        </div>

        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                  activeImageIndex === index
                    ? "border-indigo-600"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={image} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column - Info */}
      <div className="flex flex-col">
        {product.category && (
          <span className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">
            {product.category.name}
          </span>
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">
          {product.name}
        </h1>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex text-amber-400">
            {"★★★★★".split("").map((star, i) => (
              <span key={i}>{star}</span>
            ))}
          </div>
          <span className="text-sm text-slate-500">
            ({product.reviews?.[0]?.count || 0} reviews)
          </span>
        </div>

        {/* Price Box */}
        <div className="bg-slate-50 rounded-xl p-4 md:p-6 mb-6 border border-slate-100">
          <div className="flex items-end gap-3 mb-2">
            <span className="text-3xl font-bold text-slate-900">
              Rs. {selectedVariant?.price.toFixed(2) || "0.00"}
            </span>
            {selectedVariant?.original_price && (
              <span className="text-lg text-slate-400 line-through mb-1">
                Rs. {selectedVariant.original_price.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Instant Digital Delivery via Email/Dashboard
          </p>
        </div>

        {/* Selectors */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Package
            </label>
            <ProductVariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onSelect={setSelectedVariant}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto space-y-3">
          <div className="flex gap-3">
            <div className="flex items-center border border-slate-300 rounded-xl w-24 md:w-32 bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex-1 px-2 py-3 hover:bg-slate-50 text-slate-600"
              >
                -
              </button>
              <span className="flex-1 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex-1 px-2 py-3 hover:bg-slate-50 text-slate-600"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              className="flex-1 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-xl py-3 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" /> Add
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            disabled={!selectedVariant}
            className="w-full bg-indigo-600 text-white font-bold rounded-xl py-4 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" /> BUY NOW
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" /> Instant Delivery
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" /> Secure Payment
          </div>
        </div>
      </div>
    </div>
  );
}
