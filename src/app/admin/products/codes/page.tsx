import { createClient } from "@/lib/supabase/server";
import CodesClient from "./CodesClient";

export const dynamic = "force-dynamic";

export default async function ProductCodesPage() {
  const supabase = await createClient();

  // Fetch product variants that use 'codes' stock type
  const { data: products } = await supabase
    .from("product_variants")
    .select(`
      id,
      variant_name,
      price,
      stock_quantity,
      product:products(name, featured_image)
    `)
    .eq("stock_type", "codes")
    .eq("is_active", true);

  return <CodesClient initialProducts={products || []} />;
}
