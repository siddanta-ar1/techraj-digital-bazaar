import { createClient } from "@/lib/supabase/server";
import {
  DollarSign,
  Users,
  ShoppingBag,
  Activity,
  ArrowUpRight,
  Clock,
  Package,
} from "lucide-react";
import Link from "next/link";

async function getAdminStats() {
  const supabase = await createClient();

  // FIX: Added 'id' to the select query below
  const [ordersRes, usersRes, productsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, final_amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("users").select("id", { count: "exact" }),
    supabase.from("products").select("id", { count: "exact" }),
  ]);

  const orders = ordersRes.data || [];

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((acc, curr) => acc + (Number(curr.final_amount) || 0), 0);

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return {
    revenue: totalRevenue,
    totalOrders: orders.length, // Displaying fetched count, ideally use {count: 'exact'} separately for total DB count
    totalUsers: usersRes.count || 0,
    totalProducts: productsRes.count || 0,
    recentOrders: orders.slice(0, 5),
  };
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-2">
          Welcome back to Techraj Admin Panel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-indigo-500"
        />
        <StatCard
          title="Recent Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-emerald-500"
        />
        <StatCard
          title="Active Products"
          value={stats.totalProducts}
          icon={Activity}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded shadow-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Order #{order.id?.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      Rs. {order.final_amount}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full capitalize ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No recent orders found.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionLink
              href="/admin/products/new"
              label="Add Product"
              icon={Package}
            />
            <QuickActionLink
              href="/admin/wallet"
              label="Approve Top-ups"
              icon={ArrowUpRight}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}`} />
        </div>
      </div>
    </div>
  );
}

function QuickActionLink({ href, label, icon: Icon }: any) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl hover:bg-white hover:border-indigo-500 hover:shadow-md transition-all group"
    >
      <Icon className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 mb-3 transition-colors" />
      <span className="font-medium text-slate-600 group-hover:text-slate-900">
        {label}
      </span>
    </Link>
  );
}
