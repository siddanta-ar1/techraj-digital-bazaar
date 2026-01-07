"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  featured_image: string;
  category: { name: string } | null;
}

// Global cache to store results for the session
const searchCache = new Map<string, SearchResult[]>();

export default function SearchWithDropdown() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Reset if query is too short
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setShowDropdown(false);
      return;
    }

    // 2. Check Cache for instant results
    if (searchCache.has(query.trim().toLowerCase())) {
      setResults(searchCache.get(query.trim().toLowerCase()) || []);
      setLoading(false);
      setShowDropdown(true);
      return;
    }

    // 3. Setup AbortController to cancel previous pending requests
    const controller = new AbortController();

    const performSearch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, featured_image, category:categories(name)")
          .ilike("name", `%${query}%`)
          .eq("is_active", true)
          .limit(6);

        if (error) throw error;

        const formattedData: SearchResult[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          featured_image: item.featured_image,
          category: Array.isArray(item.category)
            ? item.category[0]
            : item.category,
        }));

        // Store in cache
        searchCache.set(query.trim().toLowerCase(), formattedData);

        // Only update state if the request wasn't aborted
        if (!controller.signal.aborted) {
          setResults(formattedData);
          setShowDropdown(true);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    // Debounce: Wait 300ms after user stops typing
    const timer = setTimeout(performSearch, 300);

    return () => {
      clearTimeout(timer);
      controller.abort(); // Cancel the request if query changes again
    };
  }, [query, supabase]);

  // Click outside to close logic
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative w-full group" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Search products (e.g. Netflix, Pubg...)"
          className="block w-full pl-10 pr-10 py-2.5 border-none rounded-full leading-5 bg-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:shadow-sm transition-all text-sm"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowDropdown(false);
            }}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-150">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between border-b border-slate-50 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Top Results
                </span>
                <span className="text-[10px] text-slate-300">
                  {results.length} found
                </span>
              </div>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 transition-colors group"
                >
                  <div className="h-10 w-10 relative bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100 group-hover:border-indigo-100">
                    {product.featured_image ? (
                      <Image
                        src={product.featured_image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                        NO IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium capitalize">
                      {product.category?.name || "Digital Item"}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              ))}
              <div className="p-2 border-t border-slate-50 mt-1">
                <button
                  onClick={() => handleSubmit()}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 py-2.5 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  See all results for "{query}"{" "}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                  <Search className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  No products found
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try a different keyword like "Netflix"
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
