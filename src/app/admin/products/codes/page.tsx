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
} from "lucide-react";

export default function ProductCodesManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [codes, setCodes] = useState<any[]>([]);

  // Form Inputs
  const [newCodes, setNewCodes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(""); // New: Value of the code

  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // 1. Fetch Products that are marked as 'stock_type: codes'
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("id, variant_name, product:products(name)")
        .eq("stock_type", "codes");

      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  // 2. Fetch Existing Inventory for Selected Variant
  const fetchCodes = async (variantId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("product_codes")
      .select("*")
      .eq("variant_id", variantId)
      .eq("is_used", false) // We usually only want to see available stock
      .order("created_at", { ascending: false });

    if (data) setCodes(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedVariant) fetchCodes(selectedVariant);
  }, [selectedVariant]);

  // 3. BULK ADD HANDLER
  const handleAddCodes = async () => {
    if (!newCodes.trim() || !selectedVariant) return;

    // Validation: Ensure we have a value attached
    if (!discountAmount || Number(discountAmount) <= 0) {
      alert(
        "Please enter a valid Discount/Value amount (e.g., 500 for a Rs. 500 card).",
      );
      return;
    }

    setLoading(true);

    // Split text by newline to create multiple rows
    const codeList = newCodes
      .split("\n")
      .filter((c) => c.trim() !== "")
      .map((c) => ({
        variant_id: selectedVariant,
        code: c.trim(),
        discount_amount: Number(discountAmount), // Save the money value!
        is_used: false,
      }));

    if (codeList.length === 0) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("product_codes").insert(codeList);

    if (!error) {
      setNewCodes("");
      // Keep discountAmount filled in case they want to add more of the same value
      fetchCodes(selectedVariant);
      alert(`Successfully added ${codeList.length} codes!`);
    } else {
      alert("Error adding codes: " + error.message);
    }
    setLoading(false);
  };

  // 4. Delete Code
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    await supabase.from("product_codes").delete().eq("id", id);
    setCodes((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Manage Digital Inventory
        </h1>
        <p className="text-slate-500">
          Add codes here. The system will automatically email them to customers
          upon purchase.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT: Add New Codes */}
        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" /> Add Stock
          </h2>

          {/* Product Selector */}
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Product Variant
          </label>
          <select
            className="w-full p-3 border rounded-lg mb-4 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
          >
            <option value="">-- Choose a Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product.name} - {p.variant_name}
              </option>
            ))}
          </select>

          {/* Value/Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Code Value (Rs.)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              How much is this code worth? (e.g. Enter 100 for a Rs. 100 Top-up)
            </p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="number"
                className="w-full pl-10 p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 500"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                disabled={!selectedVariant}
              />
            </div>
          </div>

          {/* Bulk Text Area */}
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Paste Codes (One per line)
          </label>
          <textarea
            className="w-full p-3 border rounded-lg h-48 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder={"ABCD-1234-XYZW\nEFGH-5678-IJKL\nMNOP-9012-QRST"}
            value={newCodes}
            onChange={(e) => setNewCodes(e.target.value)}
            disabled={!selectedVariant}
          />

          <button
            onClick={handleAddCodes}
            disabled={
              loading || !selectedVariant || !newCodes || !discountAmount
            }
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save to Inventory
          </button>
        </div>

        {/* RIGHT: Inventory List */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Current Inventory</h3>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              {codes.length} Available
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {codes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Search className="w-10 h-10 mb-2 opacity-20" />
                <p>No unused codes found.</p>
              </div>
            ) : (
              codes.map((code) => (
                <div
                  key={code.id}
                  className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-indigo-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <code className="text-sm font-mono text-slate-800 font-bold block select-all">
                        {code.code}
                      </code>
                      {/* Show the attached value */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          <Tag className="w-3 h-3" />
                          Rs. {code.discount_amount || 0}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Added:{" "}
                          {new Date(code.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(code.id)}
                      className="text-slate-300 hover:text-red-500 p-2 rounded hover:bg-red-50 transition-colors"
                      title="Delete Code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
