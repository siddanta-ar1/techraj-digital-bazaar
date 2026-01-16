import { createClient } from "@/lib/supabase/server";
import { Package, CreditCard, History, Settings, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get Session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 2. Fetch User Profile (Wallet)
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, wallet_balance, email")
    .eq("id", userId)
    .single();

  // 3. Fetch Order Stats
  const { data: orders } = await supabase
    .from("orders")
    .select("status")
    .eq("user_id", userId);

  // Calculate Stats
  const totalOrders = orders?.length || 0;
  const pendingOrders =
    orders?.filter((o) => o.status === "pending").length || 0;
  const completedOrders =
    orders?.filter((o) => o.status === "completed").length || 0;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen pb-12">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg rounded-2xl mb-8">
        <div className="px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back,{" "}
                {userProfile?.full_name || session.user.email?.split("@")[0]}!
              </p>
            </div>
            {/* Note: Sign Out is handled by the Sidebar/Nav component */}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Wallet Balance
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            Rs. {(userProfile?.wallet_balance ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Total Orders
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalOrders}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <History className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Pending Orders
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {pendingOrders}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Completed Orders
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {completedOrders}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/orders"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Package className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  My Orders
                </h3>
                <p className="text-sm text-slate-500">View and track orders</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/wallet"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Wallet className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Wallet Top-up
                </h3>
                <p className="text-sm text-slate-500">Add funds</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Settings className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-slate-500">Update profile</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
