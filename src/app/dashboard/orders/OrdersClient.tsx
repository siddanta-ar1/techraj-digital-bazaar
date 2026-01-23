// src/app/dashboard/orders/OrdersClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import OrderCard from "@/components/orders/OrderCard";
import { createClient } from "@/lib/supabase/client";

// ... [Keep interfaces identical to your provided code] ...
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

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  final_amount: number;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_method: "wallet" | "esewa" | "bank_transfer";
  payment_status: "pending" | "paid" | "failed";
  delivery_type: "auto" | "manual";
  created_at: string;
  order_items: OrderItem[];
}

interface OrdersClientProps {
  initialOrders: any[];
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter();
  const [orders] = useState<Order[]>(initialOrders as Order[]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("my-orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some((item) =>
        item.variant?.product?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No orders found
            </h3>
            <p className="text-slate-500 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
