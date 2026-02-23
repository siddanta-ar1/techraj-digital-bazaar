"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  Tag,
  Loader2,
  Save,
  X,
  Edit3,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Filter,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

interface Props {
  initialData: PromoCode[];
}

export default function PromoClient({ initialData }: Props) {
  const [promos, setPromos] = useState<PromoCode[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();
  const {
    modalState,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
  } = useModal();

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    max_discount_amount: "",
    min_order_amount: "0",
    usage_limit: "",
    expires_at: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form
  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      max_discount_amount: "",
      min_order_amount: "0",
      usage_limit: "",
      expires_at: "",
    });
    setErrors({});
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Promo code is required";
    } else if (formData.code.length < 3) {
      newErrors.code = "Promo code must be at least 3 characters";
    }

    if (!formData.discount_value || Number(formData.discount_value) <= 0) {
      newErrors.discount_value = "Discount value must be greater than 0";
    }

    if (
      formData.discount_type === "percentage" &&
      Number(formData.discount_value) > 100
    ) {
      newErrors.discount_value = "Percentage cannot exceed 100%";
    }

    if (Number(formData.min_order_amount) < 0) {
      newErrors.min_order_amount = "Minimum order amount cannot be negative";
    }

    if (formData.usage_limit && Number(formData.usage_limit) <= 0) {
      newErrors.usage_limit = "Usage limit must be greater than 0";
    }

    if (formData.expires_at) {
      const expiryDate = new Date(formData.expires_at);
      if (expiryDate <= new Date()) {
        newErrors.expires_at = "Expiry date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Refresh promos after CRUD operations
  const fetchPromos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromos(data || []);
    } catch (error: any) {
      showError("Error Loading Promo Codes", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Create/Update Promo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showWarning(
        "Please Fix Errors",
        "Please correct the highlighted fields before submitting.",
      );
      return;
    }

    const promoData = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      max_discount_amount: formData.max_discount_amount
        ? Number(formData.max_discount_amount)
        : null,
      min_order_amount: Number(formData.min_order_amount),
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      expires_at: formData.expires_at || null,
      is_active: true,
    };

    try {
      let error;

      if (editingPromo) {
        // Update existing promo
        const { error: updateError } = await supabase
          .from("promo_codes")
          .update(promoData)
          .eq("id", editingPromo.id);
        error = updateError;
      } else {
        // Create new promo
        const { error: insertError } = await supabase
          .from("promo_codes")
          .insert([promoData]);
        error = insertError;
      }

      if (error) throw error;

      showSuccess(
        editingPromo ? "Promo Updated!" : "Promo Created!",
        `The promo code "${promoData.code}" has been ${editingPromo ? "updated" : "created"} successfully.`,
      );

      setIsCreating(false);
      setEditingPromo(null);
      resetForm();
      fetchPromos();
    } catch (error: any) {
      if (error.code === "23505") {
        showError(
          "Duplicate Code",
          "A promo code with this name already exists.",
        );
      } else {
        showError("Error Saving Promo", error.message);
      }
    }
  };

  // 3. Delete Promo
  const handleDelete = (promo: PromoCode) => {
    showConfirm(
      "Delete Promo Code",
      `Are you sure you want to delete the promo code "${promo.code}"? This action cannot be undone.`,
      async () => {
        try {
          const { error } = await supabase
            .from("promo_codes")
            .delete()
            .eq("id", promo.id);

          if (error) throw error;

          setPromos((prev) => prev.filter((p) => p.id !== promo.id));
          showSuccess(
            "Promo Deleted",
            "The promo code has been deleted successfully.",
          );
        } catch (error: any) {
          showError("Error Deleting Promo", error.message);
        }
      },
    );
  };

  // 4. Toggle Active Status
  const toggleStatus = async (promo: PromoCode) => {
    try {
      const newStatus = !promo.is_active;
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: newStatus })
        .eq("id", promo.id);

      if (error) throw error;

      setPromos((prev) =>
        prev.map((p) =>
          p.id === promo.id ? { ...p, is_active: newStatus } : p,
        ),
      );

      showSuccess(
        `Promo ${newStatus ? "Activated" : "Deactivated"}`,
        `The promo code "${promo.code}" has been ${newStatus ? "activated" : "deactivated"}.`,
      );
    } catch (error: any) {
      showError("Error Updating Status", error.message);
    }
  };

  // 5. Start editing
  const startEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      max_discount_amount: promo.max_discount_amount?.toString() || "",
      min_order_amount: promo.min_order_amount.toString(),
      usage_limit: promo.usage_limit?.toString() || "",
      expires_at: promo.expires_at
        ? new Date(promo.expires_at).toISOString().slice(0, 16)
        : "",
    });
    setIsCreating(true);
  };

  // 6. Export promos to CSV
  const handleExport = () => {
    if (filteredPromos.length === 0) {
      showWarning("No Data to Export", "There are no promo codes to export.");
      return;
    }

    const headers = [
      "Code",
      "Type",
      "Value",
      "Min Order",
      "Max Uses",
      "Current Uses",
      "Status",
      "Expires",
      "Created",
    ];

    const csvData = filteredPromos.map((promo) => [
      promo.code,
      promo.discount_type === "percentage" ? "Percentage" : "Fixed Amount",
      promo.discount_value,
      promo.min_order_amount,
      promo.usage_limit || "Unlimited",
      promo.usage_count,
      promo.is_active ? "Active" : "Inactive",
      promo.expires_at
        ? new Date(promo.expires_at).toLocaleDateString()
        : "No Expiry",
      new Date(promo.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `promo-codes-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess(
      "Export Complete",
      "Promo codes have been exported to CSV file.",
    );
  };

  // Filter promos
  const filteredPromos = promos.filter((promo) => {
    const matchesSearch = promo.code
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && promo.is_active) ||
      (filterStatus === "inactive" && !promo.is_active);

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const totalPromos = promos.length;
  const activePromos = promos.filter((p) => p.is_active).length;
  const totalUsage = promos.reduce((sum, p) => sum + p.usage_count, 0);
  const expiringSoon = promos.filter((p) => {
    if (!p.expires_at) return false;
    const expiryDate = new Date(p.expires_at);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Tag className="h-8 w-8 text-indigo-600" />
                Promo Code Manager
              </h1>
              <p className="text-slate-500 mt-2">
                Create and manage discount codes and promotional offers
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={filteredPromos.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingPromo(null);
                  setIsCreating(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Promo Code
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Codes</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalPromos}
                </p>
              </div>
              <Tag className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Codes</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {activePromos}
                </p>
              </div>
              <Eye className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Usage</p>
                <p className="text-2xl font-bold text-blue-600">{totalUsage}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-600">
                  {expiringSoon}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* CREATE/EDIT FORM */}
        {isCreating && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingPromo ? "Edit Promo Code" : "Create New Promo Code"}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPromo(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Code Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    placeholder="SUMMER50"
                    className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors uppercase ${errors.code ? "border-red-300" : "border-slate-300"
                      }`}
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value });
                      if (errors.code) setErrors({ ...errors, code: "" });
                    }}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                  )}
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discount Type *
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as "percentage" | "fixed",
                      })
                    }
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={
                      formData.discount_type === "percentage" ? "10" : "100"
                    }
                    className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${errors.discount_value
                      ? "border-red-300"
                      : "border-slate-300"
                      }`}
                    value={formData.discount_value}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      });
                      if (errors.discount_value)
                        setErrors({ ...errors, discount_value: "" });
                    }}
                  />
                  {errors.discount_value && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.discount_value}
                    </p>
                  )}
                </div>

                {/* Max Discount Amount (for percentage) */}
                {formData.discount_type === "percentage" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Max Discount Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_amount: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Optional: Cap the maximum discount amount
                    </p>
                  </div>
                )}

                {/* Min Order Amount */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Min Order Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${errors.min_order_amount
                      ? "border-red-300"
                      : "border-slate-300"
                      }`}
                    value={formData.min_order_amount}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        min_order_amount: e.target.value,
                      });
                      if (errors.min_order_amount)
                        setErrors({ ...errors, min_order_amount: "" });
                    }}
                  />
                  {errors.min_order_amount && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.min_order_amount}
                    </p>
                  )}
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${errors.usage_limit ? "border-red-300" : "border-slate-300"
                      }`}
                    value={formData.usage_limit}
                    onChange={(e) => {
                      setFormData({ ...formData, usage_limit: e.target.value });
                      if (errors.usage_limit)
                        setErrors({ ...errors, usage_limit: "" });
                    }}
                  />
                  {errors.usage_limit && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.usage_limit}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty for unlimited usage
                  </p>
                </div>

                {/* Expires At */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expiry Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${errors.expires_at ? "border-red-300" : "border-slate-300"
                      }`}
                    value={formData.expires_at}
                    onChange={(e) => {
                      setFormData({ ...formData, expires_at: e.target.value });
                      if (errors.expires_at)
                        setErrors({ ...errors, expires_at: "" });
                    }}
                  />
                  {errors.expires_at && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.expires_at}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty for no expiry
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPromo(null);
                    resetForm();
                  }}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingPromo ? "Update Promo Code" : "Create Promo Code"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILTERS AND LIST */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                All Promo Codes
              </h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white px-4 py-2 pl-4 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as "all" | "active" | "inactive",
                    )
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    Code
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    Discount
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    Usage
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    Expiry
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                      <p className="text-slate-500">Loading promo codes...</p>
                    </td>
                  </tr>
                ) : filteredPromos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      {searchTerm || filterStatus !== "all"
                        ? "No promo codes match your filters."
                        : "No promo codes found. Create your first one above!"}
                    </td>
                  </tr>
                ) : (
                  filteredPromos.map((promo) => (
                    <tr
                      key={promo.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <code className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-sm">
                          {promo.code}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {promo.discount_type === "percentage"
                            ? `${promo.discount_value}% OFF`
                            : `Rs. ${promo.discount_value} OFF`}
                        </div>
                        <div className="text-xs text-slate-500">
                          Min Order: Rs. {promo.min_order_amount}
                          {promo.max_discount_amount && (
                            <span> • Max: Rs. {promo.max_discount_amount}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {promo.usage_count} / {promo.usage_limit || "∞"}
                        </div>
                        {promo.usage_limit && (
                          <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, (promo.usage_count / promo.usage_limit) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {promo.expires_at ? (
                          <div>
                            <div className="text-sm text-slate-900">
                              {new Date(promo.expires_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(promo.expires_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">
                            No expiry
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(promo)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${promo.is_active
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                        >
                          {promo.is_active ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(promo)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Modal */}
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
        autoClose={modalState.autoClose}
        autoCloseDelay={modalState.autoCloseDelay}
      />
    </div>
  );
}
