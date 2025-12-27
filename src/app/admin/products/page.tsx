import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import ProductListClient from "./ProductListClient";

export const metadata = {
  title: "Products - Admin Panel",
};

export default async function AdminProductsPage() {
  const supabase = await createClient();

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-2">
            Manage your digital products catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <ProductListClient initialProducts={products || []} />
      </div>
    </div>
  );
}
