// src/app/dashboard/orders/page.tsx
import { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "My Orders - Tronline Bazar",
  description: "View your order history and track deliveries",
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch user's orders
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items(
        *,
        variant:product_variants(
          variant_name,
          product:products(name)
        )
      )
    `,
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Calculate stats safely on the server
  const safeOrders = orders || [];
  const totalOrders = safeOrders.length;
  const pendingOrders = safeOrders.filter((o) => o.status === "pending").length;
  const completedOrders = safeOrders.filter(
    (o) => o.status === "completed",
  ).length;
  const totalSpent = safeOrders
    .reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0)
    .toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-indigo-600" />
          My Orders
        </h1>
        <p className="text-slate-600 mt-2">Track and manage your orders</p>
      </div>

      {/* Stats - Rendered directly to ensure safety */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-xl font-bold text-slate-900 mt-2">
                {totalOrders}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-500 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-xl font-bold text-slate-900 mt-2">
                {pendingOrders}
              </p>
            </div>
            <div className="h-10 w-10 bg-amber-500 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-xl font-bold text-slate-900 mt-2">
                {completedOrders}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-500 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Spent</p>
              <p className="text-xl font-bold text-slate-900 mt-2">
                Rs. {totalSpent}
              </p>
            </div>
            <div className="h-10 w-10 bg-purple-500 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <OrdersClient initialOrders={safeOrders} />
    </div>
  );
}
