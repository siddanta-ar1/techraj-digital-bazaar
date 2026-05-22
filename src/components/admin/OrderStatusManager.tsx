"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function OrderStatusManager({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, updates: { status: newStatus } }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      setStatus(newStatus);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Update Status
        </label>
        <select
          value={status}
          onChange={(e) => updateStatus(e.target.value)}
          disabled={loading}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center text-sm text-indigo-600 gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Updating...
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {status === "completed" && !loading && (
        <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
          Order completed. Digital codes delivered and customer notified by email.
        </div>
      )}

      {status === "cancelled" && !loading && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          Order cancelled. Customer has been notified by email.
        </div>
      )}
    </div>
  );
}
