import { createClient } from "@/lib/supabase/server";
import { Plus, Package } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-indigo-600" />
              Products
            </h1>
            <p className="text-slate-500 mt-2">
              Manage your digital products catalog
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <ProductListClient initialProducts={products || []} />
        </div>
      </div>
    </div>
  );
}
