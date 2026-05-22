"use client";

import { useState } from "react";
import { Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrdersHeaderProps {
  orders: any[];
}

export default function OrdersHeader({ orders }: OrdersHeaderProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  const exportToCSV = () => {
    const headers = [
      "Order Number", "Customer Name", "Email", "Phone",
      "Total Amount", "Final Amount", "Status",
      "Payment Method", "Payment Status", "Created Date", "Items",
    ];

    const csvData = orders.map((order) => {
      const items =
        order.order_items
          ?.map(
            (item: any) =>
              `${item.variant?.product?.name} - ${item.variant?.variant_name} (${item.quantity})`,
          )
          .join("; ") || "";

      return [
        order.order_number,
        order.user?.full_name || "Guest",
        order.user?.email || "",
        order.user?.phone || "",
        order.total_amount,
        order.final_amount,
        order.status,
        order.payment_method,
        order.payment_status,
        new Date(order.created_at).toLocaleDateString(),
        items,
      ];
    });

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = async () => {
    if (confirmText !== "DELETE") return;
    setClearing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clear orders");
      }
      setShowConfirm(false);
      setConfirmText("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg font-medium"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>

        <button
          onClick={() => { setShowConfirm(true); setConfirmText(""); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg font-medium"
        >
          <Trash2 className="h-4 w-4" />
          Clear All Orders
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Clear All Orders</h2>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              This will permanently delete <strong>all orders and order items</strong> from
              the database. Export a CSV backup first if you need the data.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-red-700 mb-2">
                Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={confirmText !== "DELETE" || clearing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {clearing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Clearing...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Clear All Orders</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
