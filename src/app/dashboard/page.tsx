import { createClient } from "@/lib/supabase/server";
import {
  Package,
  CreditCard,
  Clock,
  Wallet,
  Settings,
  ArrowRight,
} from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-slate-200 mb-8 -mt-8 pt-8 pb-8 px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-500 text-lg">
            Welcome back,{" "}
            <span className="font-semibold text-indigo-600">
              {userProfile?.full_name || session.user.email?.split("@")[0]}
            </span>
            !
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Wallet Balance
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  Rs. {(userProfile?.wallet_balance ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {totalOrders}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Orders
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {pendingOrders}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {completedOrders}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/dashboard/orders"
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Package className="w-24 h-24 text-indigo-600 transform translate-x-4 -translate-y-4" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <Package className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                  My Orders
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  View your purchase history and track current orders.
                </p>
                <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                  View Orders <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/wallet"
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className="w-24 h-24 text-indigo-600 transform translate-x-4 -translate-y-4" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <Wallet className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                  Wallet Top-up
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Add funds to your wallet for quick checkouts.
                </p>
                <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                  Add Funds <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/settings"
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Settings className="w-24 h-24 text-indigo-600 transform translate-x-4 -translate-y-4" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <Settings className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Update your profile details and preferences.
                </p>
                <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                  Manage Account <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
