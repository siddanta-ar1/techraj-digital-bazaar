"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2, Save, X, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Variant {
  id: string;
  variant_name: string;
  price: number;
  original_price: number | null;
  stock_type: "limited" | "unlimited" | "codes";
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
}

// FIX: New Interface to handle string inputs
interface VariantFormState {
  variant_name: string;
  price: string;
  original_price: string;
  stock_type: "limited" | "unlimited" | "codes";
  stock_quantity: string;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  productId: string;
  initialVariants: Variant[];
}

export function ProductVariantsManager({ productId, initialVariants }: Props) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Sync variants when initialVariants changes, but preserve during editing
  useEffect(() => {
    if (!editingId && !isAdding) {
      setVariants(initialVariants);
    }
  }, [initialVariants]);

  // FIX: Form State initialized as strings for numeric fields
  const [formData, setFormData] = useState<VariantFormState>({
    variant_name: "",
    price: "",
    original_price: "",
    stock_type: "unlimited",
    stock_quantity: "0",
    is_active: true,
    sort_order: 0,
  });

  const resetForm = () => {
    setFormData({
      variant_name: "",
      price: "",
      original_price: "",
      stock_type: "unlimited",
      stock_quantity: "0",
      is_active: true,
      sort_order: variants.length,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (variant: Variant) => {
    // FIX: Convert numbers to strings when loading edit form
    setFormData({
      variant_name: variant.variant_name,
      price: variant.price.toString(),
      original_price: variant.original_price?.toString() || "",
      stock_type: variant.stock_type,
      stock_quantity: (variant.stock_quantity ?? 0).toString(),
      is_active: variant.is_active,
      sort_order: variant.sort_order,
    });
    setEditingId(variant.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (loading) return; // Prevent during other operations
    if (!confirm("Delete this variant?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", id);
    setLoading(false);

    if (!error) {
      setVariants((prev) => prev.filter((v) => v.id !== id));
      router.refresh();
    } else {
      alert("Failed to delete variant. It might be in use.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    setLoading(true);

    // FIX: Parsing and Validation Logic
    const parsedPrice = parseFloat(formData.price);
    const parsedOriginalPrice = formData.original_price
      ? parseFloat(formData.original_price)
      : null;
    const parsedQuantity = parseInt(formData.stock_quantity);

    if (isNaN(parsedPrice)) {
      alert("Price must be a valid number");
      setLoading(false);
      return;
    }

    const payload = {
      product_id: productId,
      variant_name: formData.variant_name,
      price: parsedPrice,
      original_price: parsedOriginalPrice,
      stock_type: formData.stock_type,
      stock_quantity: isNaN(parsedQuantity) ? 0 : parsedQuantity,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
    };

    let error;
    let data;

    if (editingId) {
      // Update
      const res = await supabase
        .from("product_variants")
        .update(payload)
        .eq("id", editingId)
        .select();
      error = res.error;
      data = res.data;
    } else {
      // Create
      const res = await supabase
        .from("product_variants")
        .insert([payload])
        .select();
      error = res.error;
      data = res.data;
    }

    setLoading(false);

    if (error) {
      alert(`Error: ${error.message}`);
    } else if (data) {
      if (editingId) {
        setVariants((prev) =>
          prev.map((v) => (v.id === editingId ? data[0] : v)),
        );
      } else {
        setVariants((prev) => [...prev, data[0]]);
      }
      resetForm();
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Product Variants
        </h3>
        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </button>
        )}
      </div>

      {/* Variant Form */}
      {isAdding && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <h4 className="font-medium text-slate-900 mb-4">
            {editingId ? "Edit Variant" : "New Variant"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Name
                </label>
                <input
                  required
                  placeholder="e.g. 100 Gems"
                  value={formData.variant_name}
                  onChange={(e) =>
                    setFormData({ ...formData, variant_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Price (Rs)
                  </label>
                  {/* FIX: Input type="number" but value is string */}
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Original Price
                  </label>
                  {/* FIX: Input type="number" but value is string */}
                  <input
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        original_price: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Stock Type
                </label>
                <select
                  value={formData.stock_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="limited">Limited Quantity</option>
                  <option value="codes">Pre-loaded Codes</option>
                </select>
              </div>
              {formData.stock_type === "limited" && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Quantity
                  </label>
                  {/* FIX: Input type="number" but value is string */}
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading && (
                  <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Save Variant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Variants Table - Remains largely the same */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variants.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No variants added yet.
                </td>
              </tr>
            ) : (
              variants.map((variant) => (
                <tr key={variant.id} className="group hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {variant.variant_name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-slate-900 font-medium">
                      Rs. {variant.price}
                    </span>
                    {variant.original_price && (
                      <span className="ml-2 text-xs text-slate-400 line-through">
                        Rs. {variant.original_price}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variant.stock_type === "unlimited"
                        ? "bg-green-100 text-green-700"
                        : variant.stock_type === "codes"
                          ? "bg-purple-100 text-purple-700"
                          : variant.stock_quantity > 0
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {variant.stock_type === "unlimited"
                        ? "Unlimited"
                        : variant.stock_type === "codes"
                          ? "Auto-Codes"
                          : `${variant.stock_quantity} left`}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(variant)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
