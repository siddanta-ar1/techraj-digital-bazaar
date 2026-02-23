import { createClient } from "@/lib/supabase/server";
import {
  Users,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Verify Admin Access
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (user?.role !== "admin") redirect("/dashboard");

  // 2. Fetch Dashboard Data in Parallel
  const [
    { count: totalUsers },
    { count: totalOrders },
    { data: revenueData },
    { count: pendingTopupsRaw }, // FIX: Renamed to handle null check below
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("final_amount").eq("status", "completed"), // Only completed orders count for revenue
    supabase
      .from("topup_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select(
        "id, order_number, final_amount, status, created_at, user:users(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // FIX: Ensure it is a number (default to 0 if null)
  const pendingTopups = pendingTopupsRaw ?? 0;

  // Calculate Total Revenue
  const totalRevenue =
    revenueData?.reduce((sum, order) => sum + (order.final_amount || 0), 0) ||
    0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500">
          Overview of store performance and activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full">
              Total Sales
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-900">
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <p className="text-sm text-emerald-600 mt-1 font-medium">
            Lifetime Revenue
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-xl text-white shadow-md">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              Orders
            </span>
          </div>
          <div className="text-3xl font-black text-blue-900">
            {totalOrders || 0}
          </div>
          <p className="text-sm text-blue-600 mt-1 font-medium">
            Total Orders Placed
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-xl text-white shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
              Users
            </span>
          </div>
          <div className="text-3xl font-black text-purple-900">
            {totalUsers || 0}
          </div>
          <p className="text-sm text-purple-600 mt-1 font-medium">
            Registered Users
          </p>
        </div>

        <Link href="/admin/wallet" className="block">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 shadow-sm hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
            {pendingTopups > 0 ? (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </div>
            ) : null}
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${pendingTopups > 0 ? "bg-red-100 text-red-700 animate-pulse" : "bg-amber-200 text-amber-700"}`}
              >
                {pendingTopups} Pending
              </span>
            </div>
            <div className="text-3xl font-black text-amber-900">
              Top-up Requests
            </div>
            <p className="text-sm text-amber-600 mt-1 group-hover:text-amber-700 transition-colors font-medium">
              Manage wallet requests &rarr;
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
            <h2 className="font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors px-3 py-1 rounded-lg hover:bg-indigo-50"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders?.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {order.order_number || `LEGACY-${order.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.user?.full_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      Rs. {order.final_amount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${order.status === "completed"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : order.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-50 text-slate-600 border-slate-100"
                          }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      No orders found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / System Status */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Plus className="w-4 h-4 text-indigo-600" />
              </div>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-800">
                    Add New Product
                  </span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>

              <Link
                href="/admin/products/codes"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-800">
                    Add Digital Codes
                  </span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-sm">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-800">
                    Manage Users
                  </span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-2xl text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-2 -mb-2 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
            <h3 className="font-bold text-lg mb-3 relative z-10 flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </div>
              Pending Tasks
            </h3>
            <div className="space-y-2 relative z-10">
              {pendingTopups > 0 ? (
                <div className="flex items-center gap-3 text-indigo-100 text-sm bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="p-1 bg-amber-500 rounded-full">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium">
                    {pendingTopups} Wallet requests to review
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-indigo-100 text-sm bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="p-1 bg-emerald-500 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium">
                    All wallet requests cleared!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
