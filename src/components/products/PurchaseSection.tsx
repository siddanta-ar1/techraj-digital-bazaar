"use client";

import { useState } from "react";

export function PurchaseSection({ product, variants }: any) {
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id);

  const handleBuyNow = () => {
    const variant = variants.find((v: any) => v.id === selectedVariant);
    console.log("Proceeding to checkout with:", variant);
    // You can add your redirect logic here, e.g., router.push(`/checkout?id=${variant.id}`)
  };

  return (
    <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-xl shadow-slate-200/50">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
          {product.name}
        </h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
          ⚡ Instant Delivery
        </span>
      </div>

      <div className="space-y-3 mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Package</p>
        <div className="grid grid-cols-1 gap-3">
          {variants.map((variant: any) => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariant(variant.id)}
              className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all text-left ${
                selectedVariant === variant.id
                  ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                  : "border-slate-100 hover:border-slate-300 bg-slate-50/30"
              }`}
            >
              <div>
                <span className="block font-bold text-slate-900 text-lg">Rs. {variant.price}</span>
                <span className="text-xs font-medium text-slate-500">{variant.name || 'Standard Package'}</span>
              </div>
              {selectedVariant === variant.id && (
                <div className="h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleBuyNow}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98]"
      >
        BUY NOW
      </button>

      {/* Trust icons remain static here */}
      <div className="mt-8 grid grid-cols-3 gap-2 border-t border-slate-100 pt-6">
        {/* ... (keep your existing trust icons) ... */}
      </div>
    </div>
  );
}
