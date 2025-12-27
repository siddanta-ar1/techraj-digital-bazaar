import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";

import { notFound } from "next/navigation";
import { ProductVariantsManager } from "@/components/admin/ProductVariansManager";

// 1. Change the type definition for params
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  // 2. Await the params object
  const { id } = await params;

  // Parallel fetch using the awaited 'id'
  const [productRes, variantsRes, categoriesRes] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("sort_order"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (productRes.error || !productRes.data) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Edit Product</h1>
        <p className="text-slate-500">
          Manage product details, pricing, and stock.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-800">Product Information</h2>
        </div>
        <div className="p-6">
          <ProductForm
            initialData={productRes.data}
            categories={categoriesRes.data || []}
          />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-800">Pricing & Variants</h2>
        </div>
        <div className="p-6">
          <ProductVariantsManager
            productId={productRes.data.id}
            initialVariants={variantsRes.data || []}
          />
        </div>
      </section>
    </div>
  );
}
