"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

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

  // Modal Hooks
  const { modalState, closeModal, showSuccess, showError, showConfirm } =
    useModal();

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
        showSuccess("Category Updated", `"${formData.name}" has been updated.`);
      } else {
        // Create
        const { error, data } = await supabase
          .from("categories")
          .insert([formData])
          .select("*, products(count)")
          .single();

        if (error) throw error;
        setCategories((prev) => [...prev, data]);
        showSuccess(
          "Category Created",
          `"${formData.name}" has been added to the list.`,
        );
      }

      resetForm();
      router.refresh();
    } catch (error: any) {
      showError("Operation Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      showError(
        "Cannot Delete",
        `This category contains ${productCount} products. Please remove or reassign them first.`,
      );
      return;
    }

    showConfirm(
      "Delete Category",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      async () => {
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", id);
        if (error) {
          showError("Delete Failed", error.message);
        } else {
          setCategories((prev) => prev.filter((c) => c.id !== id));
          showSuccess("Category Deleted", `"${name}" has been removed.`);
          router.refresh();
        }
      },
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100 flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">
                Active Categories
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold w-16">#</th>
                    <th className="px-6 py-4 font-bold">Category Name</th>
                    <th className="px-6 py-4 font-bold">Slug</th>
                    <th className="px-6 py-4 font-bold text-center">
                      Products
                    </th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => {
                    const count = Array.isArray(cat.products)
                      ? cat.products[0]?.count
                      : cat.products?.count || 0;

                    return (
                      <tr
                        key={cat.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {cat.sort_order}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl bg-slate-100 w-10 h-10 flex items-center justify-center rounded-lg">
                              {cat.icon}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {cat.name}
                              </p>
                              {!cat.is_active && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  Hidden
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          /{cat.slug}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {count} items
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(cat)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(cat.id, cat.name, count)
                              }
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {categories.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No categories found. Create one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit2 className="h-5 w-5 text-indigo-600" />
                    Edit Category
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-indigo-600" />
                    New Category
                  </>
                )}
              </h3>
              {isEditing && (
                <button
                  onClick={resetForm}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Category Name
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  placeholder="e.g. Gift Cards"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Slug (URL)
                </label>
                <input
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-slate-50 font-mono text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Icon
                  </label>
                  <input
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg text-center"
                    placeholder="🎁"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Order
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Brief description for SEO..."
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                >
                  Visible to customers
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {editingId ? "Update Category" : "Create Category"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        showConfirmButton={modalState.showConfirmButton}
      />
    </>
  );
}
