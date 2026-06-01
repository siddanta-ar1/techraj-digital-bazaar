import { createAdminClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";

export async function FeaturedProducts() {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `,
    )
    .eq("is_featured", true)
    .eq("is_active", true)
    .limit(8);

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No featured products available</p>
      </div>
    );
  }

  return (
    <div className="stagger-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
