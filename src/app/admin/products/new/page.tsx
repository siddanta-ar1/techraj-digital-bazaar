import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { PlusCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProductPage() {
  const supabase = await createClient();

  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <PlusCircle className="h-8 w-8 text-indigo-600" />
            Create New Product
          </h1>
          <p className="text-slate-500 mt-2">
            Add a new digital product to your catalog.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <ProductForm categories={categories || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
