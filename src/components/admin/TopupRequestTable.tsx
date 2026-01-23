"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Eye, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

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

  const { modalState, closeModal, showSuccess, showError, showConfirm } =
    useModal();

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const actionText = action === "approve" ? "Approve" : "Reject";
    const actionColor =
      action === "approve" ? "text-green-600" : "text-red-600";

    showConfirm(
      `${actionText} Request?`,
      `Are you sure you want to ${action} this top-up request? This action cannot be undone.`,
      async () => {
        setProcessing(id);
        try {
          const res = await fetch("/api/admin/wallet/topup-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: id,
              action,
              adminNotes: `Processed by admin via dashboard`,
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
          showSuccess("Success", `Request has been ${newStatus}.`);
          router.refresh();
        } catch (error: any) {
          showError("Error", error.message || "Error processing request");
        } finally {
          setProcessing(null);
        }
      },
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold">User</th>
              <th className="px-6 py-4 font-bold">Details</th>
              <th className="px-6 py-4 font-bold">Proof</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No top-up requests found.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {format(new Date(req.created_at), "MMM d, HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {req.user?.full_name || "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {req.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">
                      Rs. {req.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize border border-slate-200 text-slate-600">
                        {req.payment_method.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        #{req.transaction_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedImage(req.screenshot_url)}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors text-xs font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
                        req.status === "approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : req.status === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {req.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(req.id, "approve")}
                          disabled={!!processing}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {processing === req.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "reject")}
                          disabled={!!processing}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-transparent p-2 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-2"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative aspect-video w-full bg-black/50 rounded-xl overflow-hidden shadow-2xl border border-white/10">
              {/* Use standard img for external URLs to avoid Next.js config hassle, or configure domains */}
              <img
                src={selectedImage}
                alt="Payment Proof"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 text-center">
              <a
                href={selectedImage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full text-sm font-medium hover:bg-slate-100 transition-colors shadow-lg"
              >
                Open Original <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Global Modal for Confirm/Alert */}
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
      />
    </>
  );
}
