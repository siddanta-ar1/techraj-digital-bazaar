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
      {/* Professional Hero Section - Clean Style */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Digital Marketplace
            </h1>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
              Instant delivery for game cards, software subscriptions, and
              top-ups. Trusted by thousands of gamers and professionals in
              Nepal.
            </p>

            {/* Quick Stats Row */}
            <div className="flex flex-wrap gap-6 md:gap-12">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Instant Delivery
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Official Distributor
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Global Support
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-4 px-2">
                  Categories
                </h3>
                <CategoryFilter categories={categories || []} />
              </div>

              {/* Trust Box */}
              <div className="bg-slate-900 rounded-xl p-6 text-white">
                <h3 className="font-bold mb-2">Safe & Secure</h3>
                <p className="text-sm text-slate-300 mb-4">
                  We use SSL encryption to protect your payments. 100% official
                  codes.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Product Grid handles its own fetching or context if needed,
                 but if you want to pass featured products here you can.
                 Assuming ProductGrid fetches or uses context based on filters */}
            <ProductGrid showFilters={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
