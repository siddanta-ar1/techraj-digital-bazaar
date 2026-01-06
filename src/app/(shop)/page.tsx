import { createClient } from "@/lib/supabase/server";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ProductGrid } from "@/components/products/ProductGrid";

// FIXED: Added "export default async" to satisfy Next.js page requirements
export default async function HomePage() {
  const supabase = await createClient();

  // Fetch all active products for the "All Products" section
  const { data: allProducts } = await supabase
    .from("products")
    .select("*, category:categories(name), variants:product_variants(*)")
    .eq("is_active", true)
    .limit(12);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner/Slider */}
      <HeroBanner />

      {/* Featured Products Section */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-slate-900">
              🔥 Featured Products
            </h2>
            <p className="text-slate-600 font-medium">
              Best selling digital products with instant delivery
            </p>
          </div>
          {/* This component handles its own internal fetching or props */}
          <FeaturedProducts />
        </div>
      </section>

      {/* All Products Grid Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-slate-900">
              🛍️ All Products
            </h2>
            <p className="text-slate-600 font-medium">
              Browse our complete collection of digital products
            </p>
          </div>

          {/* Pass the fetched data to satisfy the required 'initialProducts' prop */}
          <ProductGrid
            initialProducts={allProducts || []}
            showFilters={false}
          />
        </div>
      </section>
    </div>
  );
}
