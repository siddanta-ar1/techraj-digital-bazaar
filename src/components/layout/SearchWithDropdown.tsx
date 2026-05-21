"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  featured_image: string | null;
  category: { name: string } | null;
}

// Module-level cache — lives for the browser session, cleared on full reload
const searchCache = new Map<string, SearchResult[]>();

// ─── Inner component (uses useSearchParams, must be inside Suspense) ──────────

function SearchCore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Version counter: incremented on every query change so stale
  // Supabase responses (which can't be truly aborted) are discarded.
  const versionRef = useRef(0);

  // Mirror the URL ?search= param in the input when on /products.
  const [query, setQuery] = useState(
    pathname === "/products" ? (searchParams.get("search") ?? "") : "",
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Keep input in sync with the URL whenever the user navigates.
  useEffect(() => {
    if (pathname === "/products") {
      setQuery(searchParams.get("search") ?? "");
    } else {
      setQuery("");
    }
    setShowDropdown(false);
    setResults([]);
  }, [pathname, searchParams]);

  // Fetch with debounce + race-condition protection via version counter.
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setShowDropdown(false);
      return;
    }

    const key = trimmed.toLowerCase();

    if (searchCache.has(key)) {
      setResults(searchCache.get(key)!);
      setLoading(false);
      setShowDropdown(true);
      return;
    }

    const version = ++versionRef.current;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, featured_image, category:categories(name)")
          .ilike("name", `%${trimmed}%`)
          .eq("is_active", true)
          .limit(6);

        // Discard if a newer search has already been initiated
        if (version !== versionRef.current) return;
        if (error) throw error;

        const formatted: SearchResult[] = (data ?? []).map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          featured_image: item.featured_image ?? null,
          category: Array.isArray(item.category)
            ? (item.category[0] ?? null)
            : (item.category ?? null),
        }));

        searchCache.set(key, formatted);
        setResults(formatted);
        setShowDropdown(true);
      } catch {
        if (version === versionRef.current) setResults([]);
      } finally {
        if (version === versionRef.current) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Invalidate any in-flight request when the query changes
      versionRef.current++;
    };
  }, [query, supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    // Also clear the URL if we're currently on the products page
    if (pathname === "/products") {
      router.push("/products");
    }
    inputRef.current?.focus();
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() =>
            results.length > 0 && query.length >= 2 && setShowDropdown(true)
          }
          placeholder="Search products (e.g. Netflix, PUBG...)"
          className="block w-full pl-10 pr-10 py-2.5 border-none rounded-full leading-5 bg-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:shadow-sm transition-all text-sm"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
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
                  onClick={() => {
                    setShowDropdown(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 transition-colors group/item"
                >
                  <div className="h-10 w-10 relative bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100 group-hover/item:border-indigo-100">
                    {product.featured_image ? (
                      <Image
                        src={product.featured_image}
                        alt={product.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                        IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover/item:text-indigo-600">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium capitalize">
                      {product.category?.name ?? "Digital Item"}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                </Link>
              ))}

              <div className="p-2 border-t border-slate-50 mt-1">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 py-2.5 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  See all results for &ldquo;{query}&rdquo;
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
                  Try a different keyword
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Suspense fallback — same visual shape to prevent layout shift ─────────────

function SearchFallback() {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400" />
      </div>
      <div className="block w-full h-[38px] pl-10 rounded-full bg-slate-100" />
    </div>
  );
}

// ─── Public export — wraps core in Suspense so callers don't have to ──────────

export default function SearchWithDropdown() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchCore />
    </Suspense>
  );
}
