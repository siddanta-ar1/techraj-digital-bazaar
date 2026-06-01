import { Metadata } from "next";
import { ShoppingBag, Package, Clock, CheckCircle, CreditCard } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "My Orders – Techraj Digital",
  description: "View your order history and track deliveries",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        variant:product_variants(variant_name, product:products(name))
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const safeOrders: any[] = orders ?? [];
  const totalOrders    = safeOrders.length;
  const pendingOrders  = safeOrders.filter((o: any) => o.status === "pending").length;
  const completedOrders = safeOrders.filter((o: any) => o.status === "completed").length;
  const totalSpent     = safeOrders
    .reduce((sum: number, o: any) => sum + (Number(o.final_amount) || 0), 0)
    .toFixed(2);

  const stats = [
    { label: "Total Orders",  value: totalOrders,    icon: Package,     bg: "bg-blue-100",    fg: "text-blue-600"    },
    { label: "Pending",       value: pendingOrders,  icon: Clock,       bg: "bg-amber-100",   fg: "text-amber-600"   },
    { label: "Completed",     value: completedOrders,icon: CheckCircle, bg: "bg-emerald-100", fg: "text-emerald-600" },
    { label: "Total Spent",   value: `Rs. ${totalSpent}`, icon: CreditCard, bg: "bg-indigo-100", fg: "text-indigo-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="text-slate-500 mt-1">Track and manage your purchases</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`${bg} p-3 rounded-xl shrink-0`}>
              <Icon className={`w-5 h-5 ${fg}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <OrdersClient initialOrders={safeOrders} />
    </div>
  );
}
