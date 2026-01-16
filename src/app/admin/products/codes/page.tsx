"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2, Save, Tag } from "lucide-react"; // Added Tag icon

export default function ProductCodesManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [codes, setCodes] = useState<any[]>([]);

  // Inputs
  const [newCodes, setNewCodes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(""); // New State for Discount

  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // 1. Fetch Products with Code Variants
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

  // 2. Fetch Codes for Selected Variant
  const fetchCodes = async (variantId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("product_codes")
      .select("*")
      .eq("variant_id", variantId)
      .eq("is_used", false)
      .order("created_at", { ascending: false });

    if (data) setCodes(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedVariant) fetchCodes(selectedVariant);
  }, [selectedVariant]);

  // 3. Add Codes Handler
  const handleAddCodes = async () => {
    if (!newCodes.trim() || !selectedVariant) return;

    // Optional: Validation to ensure discount is set
    if (!discountAmount) {
      alert("Please enter a discount value");
      return;
    }

    setLoading(true);

    // Split by newline to allow bulk entry
    const codeList = newCodes
      .split("\n")
      .filter((c) => c.trim() !== "")
      .map((c) => ({
        variant_id: selectedVariant,
        code: c.trim(),
        discount_amount: parseFloat(discountAmount), // Save the discount
        is_used: false,
      }));

    const { error } = await supabase.from("product_codes").insert(codeList);

    if (!error) {
      setNewCodes("");
      // Optional: Clear discount or keep it for next batch? keeping it is usually better UX
      fetchCodes(selectedVariant);
      alert("Codes added successfully!");
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        Manage Digital Codes
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Select & Add */}
        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Product Variant
          </label>
          <select
            className="w-full p-3 border rounded-lg mb-4 bg-slate-50"
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
          >
            <option value="">-- Select a Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product.name} - {p.variant_name}
              </option>
            ))}
          </select>

          {/* New Discount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Discount / Value Amount (Rs.)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="number"
                className="w-full pl-10 p-3 border rounded-lg bg-slate-50"
                placeholder="e.g. 500"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                disabled={!selectedVariant}
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add New Codes (One per line)
          </label>
          <textarea
            className="w-full p-3 border rounded-lg h-40 font-mono text-sm"
            // FIX: Hydration error fixed by using JS string for newline
            placeholder={"ABCD-1234-XYZW\nEFGH-5678-IJKL"}
            value={newCodes}
            onChange={(e) => setNewCodes(e.target.value)}
            disabled={!selectedVariant}
          />

          <button
            onClick={handleAddCodes}
            disabled={
              loading || !selectedVariant || !newCodes || !discountAmount
            }
            className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Codes
          </button>
        </div>

        {/* Right: List Existing */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Available Inventory</h3>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
              {codes.length} Codes
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {codes.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No unused codes found.
              </p>
            ) : (
              codes.map((code) => (
                <div
                  key={code.id}
                  className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <code className="text-sm font-mono text-slate-800 font-bold block">
                        {code.code}
                      </code>
                      {/* Display the Discount Value */}
                      <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
                        <Tag className="w-3 h-3" />
                        <span>Rs. {code.discount_amount || 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(code.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
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
