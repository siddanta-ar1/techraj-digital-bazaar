// src/app/admin/orders/page.tsx
import { Metadata } from "next";
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import AdminOrdersClient from "./AdminOrdersClient";
import OrdersHeader from "./OrdersHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Management - Admin Panel",
  description: "Manage and process customer orders",
};

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();

  // Layout already verified admin access — fetch orders directly
  const { data: orders } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
              </div>
              Order Management
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage and process customer orders
            </p>
          </div>
          <OrdersHeader orders={orders || []} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {[
            {
              label: "Total Orders",
              value: orders?.length || 0,
              color: "bg-blue-500",
              icon: ShoppingBag,
              iconColor: "text-blue-600",
              iconBg: "bg-blue-50",
            },
            {
              label: "Pending",
              value: orders?.filter((o: any) => o.status === "pending").length || 0,
              color: "bg-amber-500",
              icon: Clock,
              iconColor: "text-amber-600",
              iconBg: "bg-amber-50",
            },
            {
              label: "Processing",
              value:
                orders?.filter((o: any) => o.status === "processing").length || 0,
              color: "bg-purple-500",
              icon: Package,
              iconColor: "text-purple-600",
              iconBg: "bg-purple-50",
            },
            {
              label: "Completed",
              value:
                orders?.filter((o: any) => o.status === "completed").length || 0,
              color: "bg-green-500",
              icon: CheckCircle,
              iconColor: "text-green-600",
              iconBg: "bg-green-50",
            },
            {
              label: "Revenue",
              value: `Rs. ${
                orders
                  ?.filter((o: any) => o.status === "completed")
                  .reduce((sum: number, o: any) => sum + o.final_amount, 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }) || "0"
              }`,
              color: "bg-indigo-500",
              icon: TrendingUp,
              iconColor: "text-indigo-600",
              iconBg: "bg-indigo-50",
            },
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group ${index === 4 ? "col-span-full lg:col-span-1" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 ${stat.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Orders Table */}
        <AdminOrdersClient initialOrders={orders || []} />
    </div>
  );
}
