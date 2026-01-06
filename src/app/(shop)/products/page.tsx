import { ProductGrid } from "@/components/products/ProductGrid";
import { createClient } from "@/lib/supabase/server";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import { Search, ShieldCheck, Zap, Globe } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams; // Get the category ID from the URL
  const supabase = await createClient();

  // 1. Fetch Categories for the sidebar
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // 2. Build the Product Query
  let query = supabase
    .from("products")
    .select(
      `
        *,
        category:categories(name, slug),
        variants:product_variants(*)
      `,
    )
    .eq("is_active", true);

  // Apply the filter if a category is selected in the URL
  if (category) {
    query = query.eq("category_id", category);
  }

  const { data: products } = await query.order("created_at", {
    ascending: false,
  });
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
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <aside className="w-full lg:w-1/4">
            <div className="lg:sticky lg:top-24">
              <CategoryFilter categories={categories || []} />

              <div className="hidden lg:block mt-6 bg-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold">Safe & Secure</h3>
                </div>
                <p className="text-xs text-slate-400">
                  100% official digital codes with instant automated delivery.
                </p>
              </div>
            </div>
          </aside>

          <main className="w-full lg:w-3/4">
            {/* FIXED: Passing the fetched products to the grid */}
            <ProductGrid initialProducts={products || []} showFilters={true} />
          </main>
        </div>
      </div>
    </div>
  );
}
