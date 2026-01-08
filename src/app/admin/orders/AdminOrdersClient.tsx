// src/app/admin/orders/AdminOrdersClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

interface AdminOrdersClientProps {
  initialOrders: Order[];
}

export default function AdminOrdersClient({
  initialOrders,
}: AdminOrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Real-time subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("New order:", payload);
          // In production, you would fetch the complete order with user details
          // For now, we'll just refresh
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData } = await supabase
        .from("orders")
        .select(
          `
          *,
          user:users(full_name, email, phone),
          order_items(
            *,
            variant:product_variants(
              variant_name,
              product:products(name)
            )
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (ordersData) {
        setOrders(ordersData as Order[]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Search filter
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.phone?.includes(searchTerm);

    // Status filter
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    // Payment filter
    const matchesPayment =
      paymentFilter === "all" || order.payment_method === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, updates: { status: newStatus } }),
      });

      if (!res.ok) throw new Error("Update failed");

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as any } : o,
        ),
      );
      router.refresh();
    } catch (error) {
      alert("Error updating order status");
    }
  };

  // Update useEffect to listen for all changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalRevenue = orders
    .filter((o) => o.status === "completed" || o.status === "processing")
    .reduce((sum, o) => sum + o.final_amount, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Filters */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number, customer name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Payments</option>
              <option value="wallet">Wallet</option>
              <option value="esewa">Esewa</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mt-4">
          <div className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
            {pendingOrders} pending orders
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            Rs. {totalRevenue.toFixed(2)} revenue
          </div>
          <div className="px-3 py-1 bg-slate-100 text-slate-800 text-sm rounded-full">
            {filteredOrders.length} orders found
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedOrders.length === filteredOrders.length &&
                    filteredOrders.length > 0
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-slate-900">
                      #{order.order_number}
                    </div>
                    <div className="text-sm text-slate-500">
                      {order.order_items.length} item
                      {order.order_items.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-slate-900">
                      {order.user?.full_name || "N/A"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {order.user?.email}
                    </div>
                    <div className="text-sm text-slate-500">
                      {order.user?.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">
                    Rs. {order.final_amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {order.payment_method}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.payment_status}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {order.delivery_type === "auto" ? "Auto" : "Manual"}{" "}
                    delivery
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="p-1 text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <div className="relative">
                      <button className="p-1 text-slate-600 hover:text-slate-900">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 hidden">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(order.id, "processing")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Mark as Processing
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(order.id, "completed")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                              Mark as Completed
                            </button>
                          </>
                        )}
                        {order.status === "processing" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, "completed")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                          >
                            Mark as Completed
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, "cancelled")
                          }
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No orders found
            </h3>
            <p className="text-slate-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions & Pagination */}
      {selectedOrders.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-indigo-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-indigo-700">
              {selectedOrders.length} order
              {selectedOrders.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
                Mark as Processing
              </button>
              <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                Mark as Completed
              </button>
              <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                Cancel Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="p-6 border-t border-slate-200 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
              1
            </button>
            <button className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">
              2
            </button>
            <button className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
