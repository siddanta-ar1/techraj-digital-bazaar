import { createAdminClient } from "@/lib/supabase/server";
import { Plus, Package } from "lucide-react";
import Link from "next/link";
import ProductListClient from "./ProductListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products - Admin Panel",
};

export default async function AdminProductsPage() {
  const supabase = createAdminClient();

  // Fetch products with their category names
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name),
      variants:product_variants(count)
    `,
    )
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 shrink-0" />
            Products
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your digital products catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <ProductListClient initialProducts={products || []} />
      </div>
    </div>
  );
}
