"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Tag, Loader2, Save, X } from "lucide-react";

export default function PromoCodeManager() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage", // 'percentage' or 'fixed'
    discount_value: "",
    min_order_amount: "0",
    max_uses: "",
    expires_at: "",
  });

  // 1. Fetch Promos
  const fetchPromos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPromos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  // 2. Create Promo
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) return;

    const { error } = await supabase.from("promo_codes").insert([
      {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_amount: Number(formData.min_order_amount),
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        expires_at: formData.expires_at || null,
        is_active: true,
      },
    ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setIsCreating(false);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_amount: "0",
        max_uses: "",
        expires_at: "",
      });
      fetchPromos();
    }
  };

  // 3. Delete Promo
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    setPromos((prev) => prev.filter((p) => p.id !== id));
  };

  // 4. Toggle Active Status
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from("promo_codes")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    fetchPromos();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
          <p className="text-slate-500">Manage discounts and coupons</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      {/* CREATE FORM */}
      {isCreating && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800">New Promo Code</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code Name (e.g. SUMMER50)
              </label>
              <input
                required
                type="text"
                placeholder="SUMMER50"
                className="w-full p-2 border rounded-lg uppercase"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Type
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({ ...formData, discount_type: e.target.value })
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Value ({formData.discount_type === "percentage" ? "%" : "Rs."})
              </label>
              <input
                required
                type="number"
                placeholder="10"
                className="w-full p-2 border rounded-lg"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({ ...formData, discount_value: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Order Amount (Rs.)
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full p-2 border rounded-lg"
                value={formData.min_order_amount}
                onChange={(e) =>
                  setFormData({ ...formData, min_order_amount: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                placeholder="100"
                className="w-full p-2 border rounded-lg"
                value={formData.max_uses}
                onChange={(e) =>
                  setFormData({ ...formData, max_uses: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expires At (Optional)
              </label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded-lg"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800"
              >
                Save Promo Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-500">Code</th>
              <th className="px-6 py-4 font-medium text-slate-500">Discount</th>
              <th className="px-6 py-4 font-medium text-slate-500">Usage</th>
              <th className="px-6 py-4 font-medium text-slate-500">Status</th>
              <th className="px-6 py-4 font-medium text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {promos.map((promo) => (
              <tr key={promo.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold font-mono text-indigo-600">
                  {promo.code}
                </td>
                <td className="px-6 py-4">
                  {promo.discount_type === "percentage"
                    ? `${promo.discount_value}% OFF`
                    : `Rs. ${promo.discount_value} OFF`}
                  <div className="text-xs text-slate-400">
                    Min Order: Rs. {promo.min_order_amount}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {promo.current_uses} / {promo.max_uses || "∞"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatus(promo.id, promo.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      promo.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {promo.is_active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  No promo codes found. Create one above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
