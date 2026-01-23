import { createClient } from "@/lib/supabase/server";
import { CategoriesClient } from "./CategoriesClient";
import { FolderOpen } from "lucide-react";

export const metadata = {
  title: "Categories - Admin Panel",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FolderOpen className="h-8 w-8 text-indigo-600" />
            </div>
            Categories
          </h1>
          <p className="text-slate-500 mt-2">
            Organize your products into logical groups for better navigation.
          </p>
        </div>

        <CategoriesClient initialCategories={categories || []} />
      </div>
    </div>
  );
}
