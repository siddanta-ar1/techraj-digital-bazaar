"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Trash2, Save, X, Move } from "lucide-react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  products: { count: number }[] | { count: number };
}

export function CategoriesClient({
  initialCategories,
}: {
  initialCategories: any[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "📦",
    sort_order: 0,
    is_active: true,
  });

  const supabase = createClient();
  const router = useRouter();

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "📦",
      sort_order: (categories?.length || 0) + 1,
      is_active: true,
    });
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "📦",
      sort_order: category.sort_order || 0,
      is_active: category.is_active,
    });
    setEditingId(category.id);
    setIsEditing(true);
  };

  // Auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingId) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setFormData((prev) => ({ ...prev, name, slug }));
    } else {
      setFormData((prev) => ({ ...prev, name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update
        const { error, data } = await supabase
          .from("categories")
          .update(formData)
          .eq("id", editingId)
          .select("*, products(count)")
          .single();

        if (error) throw error;
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? data : c)),
        );
      } else {
        // Create
        const { error, data } = await supabase
          .from("categories")
          .insert([formData])
          .select("*, products(count)")
          .single();

        if (error) throw error;
        setCategories((prev) => [...prev, data]);
      }

      resetForm();
      router.refresh();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure? This will fail if products are assigned to this category.",
      )
    )
      return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      alert("Error deleting category. Make sure it has no products.");
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Products</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-500">{cat.sort_order}</td>
                  <td className="px-6 py-3 font-medium text-slate-900 flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    {cat.name}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{cat.slug}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {/* Handle array or object return from Supabase count */}
                    {Array.isArray(cat.products)
                      ? cat.products[0]?.count
                      : cat.products?.count || 0}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Column */}
      <div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">
              {editingId ? "Edit Category" : "Add Category"}
            </h3>
            {isEditing && (
              <button
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                required
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Gift Cards"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Slug (URL)
              </label>
              <input
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Icon (Emoji)
                </label>
                <input
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center"
                  placeholder="🎁"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">
                Category is active
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {loading
                ? "Saving..."
                : editingId
                  ? "Update Category"
                  : "Create Category"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
