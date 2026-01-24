import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";
import { ProductVariantsManager } from "@/components/admin/ProductVariansManager";
import { ProductOptionGroupsManager } from "@/components/admin/ProductOptionGroupsManager";
import { OptionCombinationsManager } from "@/components/admin/OptionCombinationsManager";
import { ArrowLeft, Box, Settings, Layers, Sliders, Grid } from "lucide-react";
import Link from "next/link";

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

  const product = productRes.data;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Box className="h-8 w-8 text-indigo-600" />
                Edit Product
              </h1>
              <p className="text-slate-500 mt-2">
                Manage product details, pricing, and stock configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800">
              Product Information
            </h2>
          </div>
          <div className="p-6">
            <ProductForm
              initialData={product}
              categories={categoriesRes.data || []}
            />
          </div>
        </section>

        {/* PPOM Option Groups - Only show when PPOM is enabled */}
        {product.ppom_enabled && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-100 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-600" />
              <h2 className="font-semibold text-slate-800">Option Groups</h2>
            </div>
            <div className="p-6">
              <ProductOptionGroupsManager productId={product.id} />
            </div>
          </section>
        )}

        {/* PPOM Option Combinations - Only show when PPOM is enabled */}
        {product.ppom_enabled && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-100 flex items-center gap-2">
              <Grid className="h-5 w-5 text-purple-600" />
              <h2 className="font-semibold text-slate-800">Option Combinations</h2>
            </div>
            <div className="p-6">
              <OptionCombinationsManager productId={product.id} />
            </div>
          </section>
        )}

        {/* Variants Manager - Only show when legacy variants enabled or PPOM disabled */}
        {(product.legacy_variants_enabled || !product.ppom_enabled) && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">Pricing & Variants (Legacy)</h2>
            </div>
            <div className="p-6">
              <ProductVariantsManager
                productId={product.id}
                initialVariants={variantsRes.data || []}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
