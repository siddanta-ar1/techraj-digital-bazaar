// src/app/dashboard/orders/OrdersClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import OrderCard from "@/components/orders/OrderCard";

// Define interfaces
interface OrderItem {
  id: string;
  variant: {
    variant_name: string;
    product: {
      name: string;
    };
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  delivered_code?: string;
}

// FIX: Update Order interface to use specific union types to match OrderCard
interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  final_amount: number;
  // These fields must be specific unions, not just 'string'
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_method: "wallet" | "esewa" | "bank_transfer";
  payment_status: "pending" | "paid" | "failed";
  delivery_type: "auto" | "manual";
  created_at: string;
  order_items: OrderItem[];
}

interface OrdersClientProps {
  // Use any[] here to accept data from Server Component easily,
  // then cast it to Order[] in state.
  initialOrders: any[];
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  // FIX: Cast the initialOrders to our strict Order[] type
  const [orders] = useState<Order[]>(initialOrders as Order[]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredOrders = orders.filter((order) => {
    // Search filter
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some((item) =>
        item.variant?.product?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
      );

    // Status filter
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    // Date filter
    const matchesDate =
      dateFilter === "all" ||
      (() => {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        switch (dateFilter) {
          case "today":
            return diffDays === 0;
          case "week":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          default:
            return true;
        }
      })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "processing", label: "Processing", icon: Package },
    { value: "completed", label: "Completed", icon: CheckCircle },
    { value: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  const dateOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Filters */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-slate-200">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No orders found
            </h3>
            <p className="text-slate-600 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              <ShoppingBag className="h-4 w-4" />
              Start Shopping
            </Link>
          </div>
        )}
      </div>

      {/* Footer count */}
      {filteredOrders.length > 0 && (
        <div className="p-6 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      )}
    </div>
  );
}
