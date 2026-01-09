// src/app/admin/orders/AdminOrdersClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ... [Keep interfaces OrderItem and Order exactly as they are] ...
interface OrderItem {
  id: string;
  variant: {
    variant_name: string;
    product: {
      name: string;
    };
  };
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  user: {
    full_name: string;
    email: string;
    phone: string;
  };
  total_amount: number;
  final_amount: number;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_method: "wallet" | "esewa" | "bank_transfer";
  payment_status: "pending" | "paid" | "failed";
  delivery_type: "auto" | "manual";
  created_at: string;
  order_items: OrderItem[];
}

export default function AdminOrdersClient({
  initialOrders,
}: {
  initialOrders: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        status: statusFilter,
        payment: paymentFilter,
        search: searchTerm,
        limit: "10",
      });
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalCount(data.total);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on filter change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, statusFilter, paymentFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, updates: { status: newStatus } }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        setActiveMenuId(null);
      } else {
        alert("Failed to update status. Check console.");
      }
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkAction = async (status: string) => {
    if (!confirm(`Update ${selectedOrders.length} orders to ${status}?`))
      return;
    setLoading(true);
    await Promise.all(
      selectedOrders.map((id) => handleStatusUpdate(id, status)),
    );
    setSelectedOrders([]);
    fetchOrders();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header & Filters */}
      <div className="p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-400"
              placeholder="Search by Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 outline-none text-slate-700 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Order", "Customer", "Amount", "Status", "Actions"].map(
                (head) => (
                  <th
                    key={head}
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="font-mono font-medium text-slate-900">
                    #{order.order_number}
                  </span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {/* FIX: Explicit text-slate-900 prevents hidden text on white bg */}
                  <div className="text-sm font-medium text-slate-900">
                    {order.user?.full_name || "Guest User"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {order.user?.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Rs. {order.final_amount}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {order.payment_method.replace("_", " ")}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={() =>
                      setActiveMenuId(
                        activeMenuId === order.id ? null : order.id,
                      )
                    }
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                  >
                    {updatingId === order.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    ) : (
                      <MoreVertical className="h-5 w-5" />
                    )}
                  </button>

                  {/* Action Menu */}
                  {activeMenuId === order.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-8 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            router.push(`/admin/orders/${order.id}`);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" /> View Details
                        </button>

                        <div className="h-px bg-slate-100 my-1"></div>

                        {order.status !== "completed" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, "completed")
                            }
                            className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" /> Mark Completed
                          </button>
                        )}

                        {order.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, "cancelled")
                            }
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4" /> Cancel Order
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 border-t border-slate-200 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Page {currentPage} of {totalPages || 1}
        </p>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1 || loading}
            onClick={() => {
              setCurrentPage((prev) => prev - 1);
              fetchOrders(currentPage - 1);
            }}
            className="p-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            disabled={currentPage === totalPages || loading}
            onClick={() => {
              setCurrentPage((prev) => prev + 1);
              fetchOrders(currentPage + 1);
            }}
            className="p-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 text-slate-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "processing":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}
