import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetail } from "@/components/products/ProductDetail";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DeliveryInfo } from "@/components/products/DeliveryInfo";
import { TrustBadges } from "@/components/products/TrustBadges";

// --- Metadata Generation ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product)
    return {
      title: "Product Not Found - Techraj Digital Bazar",
    };

  return {
    title: `${product.name} - Techraj Digital Bazar`,
    description: product.description?.substring(0, 160),
  };
}

// --- Main Page Component ---
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Product Data (Parallel data fetching could be optimized here if needed)
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    notFound();
  }

  // 2. Fetch Reviews Count
  const { count: reviewsCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("product_id", product.id)
    .eq("is_approved", true);

  // 3. Fetch Related Products
  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("category_id", product.category_id)
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(4);

  const productWithReviews = {
    ...product,
    reviews: [{ count: reviewsCount || 0 }],
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header / Breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb category={product.category} product={product} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Top Section: Gallery & Purchase Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          {/* ProductDetail usually handles the grid layout for Image (Left) and Info (Right) */}
          <ProductDetail product={productWithReviews} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Description & Delivery Info */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Tab */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                📄 Product Details
              </h3>
              <div className="prose prose-slate max-w-none prose-img:rounded-xl">
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">
                  {product.description || "No description available."}
                </p>
              </div>

              {product.delivery_instructions && (
                <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                  <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                    🚚 Delivery Instructions
                  </h4>
                  <p className="text-indigo-700 text-sm leading-relaxed">
                    {product.delivery_instructions}
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Timeline Component */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                Delivery Process
              </h3>
              <DeliveryInfo product={product} />
            </div>
          </div>

          {/* Right Column: Trust Badges & Support */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              <TrustBadges />

              {/* Help Widget */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white text-center">
                <h4 className="font-bold text-lg mb-2">Need Help?</h4>
                <p className="text-slate-300 text-sm mb-4">
                  Unsure which region to buy? Chat with our support team.
                </p>
                <a
                  href="/contact"
                  className="inline-block bg-white text-slate-900 px-6 py-2 rounded-full text-sm font-bold hover:bg-indigo-50 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                You Might Also Like
              </h2>
            </div>
            <RelatedProducts products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
