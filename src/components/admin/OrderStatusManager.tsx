"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const router = useRouter();
  const supabase = createClient();

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    setLoading(false);
    if (!error) {
      setStatus(newStatus);
      router.refresh();
    } else {
      alert("Failed to update status");
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
          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
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

      {status === "completed" && (
        <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg">
          Order is marked as complete. User has been notified.
        </div>
      )}
    </div>
  );
}
