import { createClient } from "@/lib/supabase/server";
import {
  Users,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
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
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              Total Sales
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <p className="text-sm text-slate-500 mt-1">Lifetime Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalOrders || 0}
          </div>
          <p className="text-sm text-slate-500 mt-1">Total Orders Placed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalUsers || 0}
          </div>
          <p className="text-sm text-slate-500 mt-1">Registered Users</p>
        </div>

        <Link href="/admin/wallet" className="block">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
            {pendingTopups > 0 ? (
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full m-4 animate-pulse"></div>
            ) : null}
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Wallet className="w-6 h-6" />
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${pendingTopups > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}
              >
                {pendingTopups} Pending
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              Top-up Requests
            </div>
            <p className="text-sm text-slate-500 mt-1 group-hover:text-amber-600 transition-colors">
              Manage wallet requests &rarr;
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              View All
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
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.user?.full_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      Rs. {order.final_amount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          order.status === "completed"
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700">
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
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700">
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
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700">
                    Manage Users
                  </span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className="bg-indigo-900 p-6 rounded-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <h3 className="font-bold text-lg mb-2 relative z-10">
              Pending Tasks
            </h3>
            <div className="space-y-2 relative z-10">
              {pendingTopups > 0 ? (
                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>{pendingTopups} Wallet requests to review</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All wallet requests cleared!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
