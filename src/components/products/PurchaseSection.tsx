"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Loader2, ShoppingCart, Zap, AlertCircle } from "lucide-react";

export function PurchaseSection({ product, variants = [] }: any) {
  const router = useRouter();
  const { addItem } = useCart();

  // Initialize with first variant if available
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id);
  const [isBuying, setIsBuying] = useState(false);

  // Update selected variant if variants prop changes
  useEffect(() => {
    if (
      variants.length > 0 &&
      !variants.find((v: any) => v.id === selectedVariant)
    ) {
      setSelectedVariant(variants[0].id);
    }
  }, [variants, selectedVariant]);

  // Find the full variant object based on ID
  const activeVariant =
    variants.find((v: any) => v.id === selectedVariant) || variants[0];

  const handleBuyNow = async () => {
    if (!activeVariant) {
      alert("Please select a package.");
      return;
    }

    setIsBuying(true);

    try {
      // 1. Add to Cart (Now persists synchronously in CartContext)
      addItem({
        productId: product.id,
        productName: product.name,
        variantId: activeVariant.id,
        variantName: activeVariant.variant_name || activeVariant.name,
        price: activeVariant.price,
        imageUrl: product.featured_image,
      });

      // 2. Redirect to Checkout
      router.push("/checkout");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart. Please try again.");
      setIsBuying(false);
    }
  };

  const hasVariants = variants && variants.length > 0;

  return (
    <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-xl shadow-slate-200/50 sticky top-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
          {product.name}
        </h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
          <Zap className="w-3 h-3 mr-1 fill-indigo-700" /> Instant Delivery
        </span>
      </div>

      <div className="space-y-3 mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Select Package
        </p>

        {!hasVariants ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            No packages available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {variants.map((variant: any) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all text-left group ${
                  selectedVariant === variant.id
                    ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                    : "border-slate-100 hover:border-slate-300 bg-slate-50/30"
                }`}
              >
                <div>
                  <span className="block font-bold text-slate-900 text-lg">
                    Rs. {variant.price}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {variant.variant_name || variant.name}
                  </span>
                </div>
                {selectedVariant === variant.id ? (
                  <div className="h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm shadow-md shadow-indigo-200">
                    ✓
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-slate-200 group-hover:border-slate-300"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleBuyNow}
          disabled={isBuying || !hasVariants}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isBuying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>BUY NOW</>
          )}
        </button>
        <p className="text-center text-xs text-slate-400">
          Secure checkout powered by TechRaj
        </p>
      </div>
    </div>
  );
}
