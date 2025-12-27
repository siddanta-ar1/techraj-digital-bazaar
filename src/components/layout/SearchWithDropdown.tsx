"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// Simplified Product type for search results
interface SearchResult {
  id: string;
  name: string;
  slug: string;
  featured_image: string;
  price?: number; // Optional if you have variants
  category: { name: string } | null;
}

export default function SearchWithDropdown() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        // Search products by name
        const { data } = await supabase
          .from("products")
          .select("id, name, slug, featured_image, category:categories(name)")
          .ilike("name", `%${query}%`)
          .limit(5);

        setResults(data || []);
        setLoading(false);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative w-full group" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          placeholder="Search..."
          className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowDropdown(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {results.length > 0 ? (
            <>
              <div className="py-2">
                <h3 className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Products
                </h3>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-10 w-10 relative bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {product.featured_image && (
                        <Image
                          src={product.featured_image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.category?.name || "Item"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="bg-slate-50 border-t border-slate-100 p-2">
                <button
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 py-2 hover:underline"
                >
                  View all results <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-slate-500">
              <p className="text-sm">No products found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
