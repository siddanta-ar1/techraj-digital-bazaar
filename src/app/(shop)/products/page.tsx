import { ProductGrid } from "@/components/products/ProductGrid";
import { createClient } from "@/lib/supabase/server";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import { Search, ShieldCheck, Zap, Globe } from "lucide-react";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-2">
            Digital Marketplace
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl">
            Instant delivery for game cards and top-ups.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Layout: Sidebar moves to top on mobile, but is more compact */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <aside className="w-full lg:w-1/4">
            <div className="lg:sticky lg:top-24">
              {/* Mobile: Categories might be better as a scrollable list or compact grid */}
              <CategoryFilter categories={categories || []} />

              <div className="hidden lg:block mt-6 bg-slate-900 rounded-2xl p-6 text-white">
                <h3 className="font-bold mb-2">Safe & Secure</h3>
                <p className="text-xs text-slate-400">
                  100% official digital codes.
                </p>
              </div>
            </div>
          </aside>

          <main className="w-full lg:w-3/4">
            <ProductGrid />
          </main>
        </div>
      </div>
    </div>
  );
}
