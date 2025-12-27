import { createClient } from "@/lib/supabase/server";
import { CategoriesClient } from "./CategoriesClient";

export const metadata = {
  title: "Categories - Admin Panel",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(count)") // Get product count for each category
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <p className="text-slate-500 mt-2">
          Organize your products into categories
        </p>
      </div>

      <CategoriesClient initialCategories={categories || []} />
    </div>
  );
}
