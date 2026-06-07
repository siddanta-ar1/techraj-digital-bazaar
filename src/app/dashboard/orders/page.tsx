import { Metadata } from "next";
import { Package, Clock, CheckCircle, CreditCard } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";
import { StatCard } from "@/components/dashboard/StatCard";

export const dynamic = "force-dynamic";

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
  const totalOrders     = safeOrders.length;
  const pendingOrders   = safeOrders.filter((o: any) => o.status === "pending").length;
  const completedOrders = safeOrders.filter((o: any) => o.status === "completed").length;
  const totalSpent      = safeOrders
    .reduce((sum: number, o: any) => sum + (Number(o.final_amount) || 0), 0)
    .toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="text-slate-500 mt-1">Track and manage your purchases</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders"  value={totalOrders}         icon={Package}      iconBg="bg-blue-100"    iconColor="text-blue-600"    />
        <StatCard label="Pending"       value={pendingOrders}       icon={Clock}        iconBg="bg-amber-100"   iconColor="text-amber-600"   />
        <StatCard label="Completed"     value={completedOrders}     icon={CheckCircle}  iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard label="Total Spent"   value={`Rs. ${totalSpent}`} icon={CreditCard}   iconBg="bg-indigo-100"  iconColor="text-indigo-600"  />
      </div>

      <OrdersClient initialOrders={safeOrders} />
    </div>
  );
}
