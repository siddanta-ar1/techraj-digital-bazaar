"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[shop] page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <div className="p-4 bg-amber-50 rounded-full">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Something went wrong</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          This page failed to load. Try refreshing or go back to the store.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/products"
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse Products
        </Link>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
