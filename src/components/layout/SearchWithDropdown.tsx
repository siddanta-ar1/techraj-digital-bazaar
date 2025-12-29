"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// Interface matches your DB structure
interface SearchResult {
  id: string;
  name: string;
  slug: string;
  featured_image: string;
  price?: number;
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

        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, featured_image, category:categories(name)")
          .ilike("name", `%${query}%`)
          .eq("is_active", true) // Only show active products
          .limit(5);

        if (error) {
          console.error("Search error:", error);
          setLoading(false);
          return;
        }

        // Normalization: Supabase returns 1:1 relations as arrays sometimes
        const formattedData: SearchResult[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          featured_image: item.featured_image,
          price: item.price,
          category: Array.isArray(item.category)
            ? item.category[0]
            : item.category,
        }));

        setResults(formattedData);
        setLoading(false);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  // Click outside to close
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
            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          placeholder="Search products..."
          className="block w-full pl-10 pr-10 py-2 border border-transparent rounded-full leading-5 bg-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all text-sm"
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
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-100">
          {results.length > 0 ? (
            <>
              <div className="py-2">
                <h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggestions
                </h3>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-8 w-8 relative bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-100">
                      {product.featured_image ? (
                        <Image
                          src={product.featured_image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          IMG
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {product.category?.name || "Product"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="bg-slate-50 border-t border-slate-100 p-2">
                <button
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  View all results <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
