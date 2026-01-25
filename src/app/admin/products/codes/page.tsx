"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  Search,
  Loader2,
  Save,
  Tag,
  DollarSign,
  Package,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

export default function ProductCodesManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [codes, setCodes] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form Inputs
  const [newCodes, setNewCodes] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
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

  // 1. Fetch Products that are marked as 'stock_type: codes'
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(
          `
          id,
          variant_name,
          price,
          stock_quantity,
          product:products(name, featured_image)
        `,
        )
        .eq("stock_type", "codes")
        .eq("is_active", true);

      if (error) {
        showError("Error Loading Products", error.message);
      } else {
        setProducts(data || []);
      }
    };
    fetchProducts();
  }, []);

  // 2. Fetch Existing Inventory for Selected Variant
  const fetchCodes = async (variantId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_codes")
      .select("*")
      .eq("variant_id", variantId)
      .eq("is_used", false)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Error Loading Codes", error.message);
    } else {
      setCodes(data || []);
      const product = products.find((p) => p.id === variantId);
      setSelectedProduct(product);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedVariant) {
      fetchCodes(selectedVariant);
    } else {
      setCodes([]);
      setSelectedProduct(null);
    }
  }, [selectedVariant]);

  // 3. BULK ADD HANDLER
  const handleAddCodes = async () => {
    if (!newCodes.trim() || !selectedVariant) {
      showWarning(
        "Missing Information",
        "Please select a product and enter codes.",
      );
      return;
    }

    if (!discountAmount || Number(discountAmount) <= 0) {
      showWarning(
        "Invalid Amount",
        "Please enter a valid discount/value amount (e.g., 500 for a Rs. 500 card).",
      );
      return;
    }

    setLoading(true);

    try {
      // Split text by newline and clean codes
      const codeList = newCodes
        .split("\n")
        .map((c) => c.trim())
        .filter((c) => c !== "")
        .map((c) => ({
          variant_id: selectedVariant,
          code: c,
          discount_amount: Number(discountAmount),
          is_used: false,
        }));

      if (codeList.length === 0) {
        showWarning("No Valid Codes", "Please enter at least one valid code.");
        setLoading(false);
        return;
      }

      // Check for duplicate codes
      const existingCodes = await supabase
        .from("product_codes")
        .select("code")
        .in(
          "code",
          codeList.map((c) => c.code),
        );

      if (existingCodes.data && existingCodes.data.length > 0) {
        const duplicates = existingCodes.data.map((c: { code: string }) => c.code).join(", ");
        showError(
          "Duplicate Codes Found",
          `The following codes already exist: ${duplicates}`,
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("product_codes").insert(codeList);

      if (error) {
        showError("Error Adding Codes", error.message);
      } else {
        setNewCodes("");
        setDiscountAmount("");
        fetchCodes(selectedVariant);
        showSuccess(
          "Codes Added Successfully!",
          `Successfully added ${codeList.length} codes to inventory.`,
        );
      }
    } catch (err: any) {
      showError("Unexpected Error", err.message || "Something went wrong.");
    }

    setLoading(false);
  };

  // 4. Delete Code
  const handleDelete = (id: string, code: string) => {
    showConfirm(
      "Delete Code",
      `Are you sure you want to delete the code "${code}"? This action cannot be undone.`,
      async () => {
        const { error } = await supabase
          .from("product_codes")
          .delete()
          .eq("id", id);

        if (error) {
          showError("Error Deleting Code", error.message);
        } else {
          setCodes((prev) => prev.filter((c) => c.id !== id));
          showSuccess(
            "Code Deleted",
            "The code has been removed from inventory.",
          );
        }
      },
    );
  };

  // 5. Bulk Delete All Codes
  const handleBulkDelete = () => {
    if (codes.length === 0) return;

    showConfirm(
      "Delete All Codes",
      `Are you sure you want to delete all ${codes.length} codes? This action cannot be undone.`,
      async () => {
        const { error } = await supabase
          .from("product_codes")
          .delete()
          .eq("variant_id", selectedVariant)
          .eq("is_used", false);

        if (error) {
          showError("Error Deleting Codes", error.message);
        } else {
          setCodes([]);
          showSuccess(
            "All Codes Deleted",
            "All codes have been removed from inventory.",
          );
        }
      },
    );
  };

  // 6. Export Codes to CSV
  const handleExportCodes = () => {
    if (codes.length === 0) {
      showWarning(
        "No Codes to Export",
        "There are no codes available to export.",
      );
      return;
    }

    const headers = ["Code", "Value (Rs.)", "Created Date"];
    const csvData = codes.map((code) => [
      code.code,
      code.discount_amount || 0,
      new Date(code.created_at).toLocaleDateString(),
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
      `product-codes-${selectedProduct?.product?.name}-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess("Export Complete", "Codes have been exported to CSV file.");
  };

  // Filter codes based on search
  const filteredCodes = codes.filter((code) =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Package className="h-8 w-8 text-indigo-600" />
                Digital Inventory Manager
              </h1>
              <p className="text-slate-500 mt-2">
                Manage product codes for digital items. Codes are automatically
                delivered to customers upon purchase.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid xl:grid-cols-3 gap-8">
          {/* LEFT: Add New Codes */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Plus className="w-5 h-5 text-indigo-600" />
                </div>
                Add New Codes
              </h2>

              {/* Product Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select Product Variant
                </label>
                <select
                  className="w-full p-4 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                >
                  <option value="">-- Choose a Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product.name} - {p.variant_name} (Rs. {p.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Value/Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Code Value (Rs.)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  How much is each code worth? (e.g., 100 for Rs. 100 gift card)
                </p>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="e.g. 500"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    disabled={!selectedVariant}
                  />
                </div>
              </div>

              {/* Bulk Text Area */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Paste Codes (One per line)
                </label>
                <textarea
                  className="w-full p-4 border border-slate-300 rounded-xl h-40 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-colors"
                  placeholder={
                    "ABCD-1234-XYZW\nEFGH-5678-IJKL\nMNOP-9012-QRST\n...\n\nPaste your codes here, one per line."
                  }
                  value={newCodes}
                  onChange={(e) => setNewCodes(e.target.value)}
                  disabled={!selectedVariant}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-500">
                    {newCodes.split("\n").filter((c) => c.trim() !== "").length}{" "}
                    codes ready
                  </span>
                  <button
                    onClick={() => setNewCodes("")}
                    className="text-xs text-slate-400 hover:text-slate-600"
                    disabled={!newCodes}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAddCodes}
                disabled={
                  loading ||
                  !selectedVariant ||
                  !newCodes.trim() ||
                  !discountAmount
                }
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding Codes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Add to Inventory
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Inventory List */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Tag className="w-5 h-5 text-emerald-600" />
                      </div>
                      Current Inventory
                      {selectedProduct && (
                        <span className="text-sm font-medium text-slate-500">
                          - {selectedProduct.product.name}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-bold">
                        {filteredCodes.length} Available
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold">
                        Rs.{" "}
                        {filteredCodes
                          .reduce((sum, c) => sum + (c.discount_amount || 0), 0)
                          .toLocaleString()}{" "}
                        Total Value
                      </span>
                    </div>
                  </div>

                  {selectedVariant && (
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search codes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-48"
                        />
                      </div>
                      <button
                        onClick={() => setShowCodes(!showCodes)}
                        className="px-4 py-2.5 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        {showCodes ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {showCodes ? "Hide" : "Show"} Codes
                      </button>
                      <button
                        onClick={handleExportCodes}
                        disabled={codes.length === 0}
                        className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={codes.length === 0}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete All
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!selectedVariant ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Package className="w-16 h-16 mb-4 opacity-20" />
                    <h4 className="text-lg font-medium mb-2">
                      No Product Selected
                    </h4>
                    <p className="text-sm text-center">
                      Select a product variant from the left panel to view and
                      manage its codes.
                    </p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                    <p className="text-slate-500">Loading codes...</p>
                  </div>
                ) : filteredCodes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Search className="w-16 h-16 mb-4 opacity-20" />
                    <h4 className="text-lg font-medium mb-2">
                      {searchTerm ? "No Matching Codes" : "No Codes Available"}
                    </h4>
                    <p className="text-sm text-center">
                      {searchTerm
                        ? "Try adjusting your search terms."
                        : "Add some codes using the form on the left to get started."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                    {filteredCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-100/50 transition-all group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <code className="text-lg font-mono font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border select-all">
                              {showCodes ? code.code : "••••••••••••"}
                            </code>
                            <span className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                              <DollarSign className="w-3.5 h-3.5" />
                              Rs. {code.discount_amount || 0}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Added:{" "}
                            {new Date(code.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(code.id, code.code)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Code"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
