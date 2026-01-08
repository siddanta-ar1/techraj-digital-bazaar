"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Eye, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TopupRequest {
  id: string;
  created_at: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  screenshot_url: string;
  status: "pending" | "approved" | "rejected";
  user: {
    full_name: string;
    email: string;
  };
}

export function TopupRequestTable({
  initialRequests,
}: {
  initialRequests: TopupRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;

    setProcessing(id);
    try {
      const res = await fetch("/api/admin/wallet/topup-requests", {
        // Updated endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          action,
          adminNotes: "Processed by admin", // Added required field
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process");
      }

      const newStatus = action === "approve" ? "approved" : "rejected";
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: newStatus } : req,
        ),
      );
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Error processing request");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Details</th>
              <th className="px-6 py-3 font-medium">Proof</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-slate-500">
                  {format(new Date(req.created_at), "MMM d, HH:mm")}
                </td>
                <td className="px-6 py-3">
                  <p className="font-medium text-slate-900">
                    {req.user?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">{req.user?.email}</p>
                </td>
                <td className="px-6 py-3">
                  <p className="font-bold text-slate-900">Rs. {req.amount}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">
                      {req.payment_method.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{req.transaction_id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => setSelectedImage(req.screenshot_url)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${
                      req.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : req.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  {req.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAction(req.id, "approve")}
                        disabled={!!processing}
                        className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "reject")}
                        disabled={!!processing}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No top-up requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-lg p-2">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative aspect-video w-full bg-slate-100 rounded overflow-hidden">
              {/* Use plain img tag for external user uploads to avoid Next.js domain config issues unless configured */}
              <img
                src={selectedImage}
                alt="Proof"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-2 text-center">
              <a
                href={selectedImage}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 text-sm hover:underline inline-flex items-center gap-1"
              >
                Open Original <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
