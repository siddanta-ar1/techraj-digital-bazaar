"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types/product";
import { Loader2, Filter, SlidersHorizontal, X } from "lucide-react";

export function ProductGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Sync state with URL params
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentSort = searchParams.get("sortBy") || "newest";
  const minP = searchParams.get("minPrice") || "0";
  const maxP = searchParams.get("maxPrice") || "10000";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products?${searchParams.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateUrl = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  if (loading && !products.length) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Toolbar - Optimized for Mobile */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900">Filters</span>
          </div>

          <select
            value={currentSort}
            onChange={(e) => updateUrl({ sortBy: e.target.value, page: "1" })}
            className="text-sm bg-slate-50 border-none rounded-lg px-3 py-2 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low-High</option>
            <option value="price_desc">Price: High-Low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
              Min
            </span>
            <input
              type="number"
              value={minP}
              onChange={(e) => updateUrl({ minPrice: e.target.value })}
              className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border-none rounded-lg ring-1 ring-slate-200"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
              Max
            </span>
            <input
              type="number"
              value={maxP}
              onChange={(e) => updateUrl({ maxPrice: e.target.value })}
              className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border-none rounded-lg ring-1 ring-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Pagination (Simplified for Mobile) */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => updateUrl({ page: (currentPage - 1).toString() })}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"
          >
            Prev
          </button>
          <span className="py-2 px-4 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => updateUrl({ page: (currentPage + 1).toString() })}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
