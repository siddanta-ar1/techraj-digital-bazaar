import { createAdminClient } from "@/lib/supabase/server";
import { TopupRequestTable } from "@/components/admin/TopupRequestTable";
import { WalletAdjustPanel } from "@/components/admin/WalletAdjustPanel";
import { Wallet, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wallet Management - Admin Panel",
};

export default async function AdminWalletPage() {
  const admin = createAdminClient();

  const [{ data: requests }, { data: pendingRows }] = await Promise.all([
    admin
      .from("topup_requests")
      .select(`*, user:users(full_name, email)`)
      .order("created_at", { ascending: false })
      .limit(50),
    // Separate unlimited query so stats reflect all pending requests, not just the first 50
    admin
      .from("topup_requests")
      .select("amount")
      .eq("status", "pending"),
  ]);

  const pendingCount = pendingRows?.length || 0;
  const pendingAmount =
    pendingRows?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
              <Wallet className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
            </div>
            Wallet Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Process top-up requests and directly credit or debit user wallets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Requests
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {pendingCount}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Value
                </p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  Rs. {pendingAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Wallet className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Action Required
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {pendingCount > 0 ? "Yes" : "No"}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  pendingCount > 0 ? "bg-red-50" : "bg-green-50"
                }`}
              >
                <AlertCircle
                  className={`h-6 w-6 ${
                    pendingCount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout: adjust panel + requests table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Direct Adjustment Panel */}
          <div className="lg:col-span-1">
            <WalletAdjustPanel />
          </div>

          {/* Top-up Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                <h2 className="font-bold text-slate-800">Top-up Requests</h2>
                {pendingCount > 0 && (
                  <span className="ml-auto px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <TopupRequestTable initialRequests={requests || []} />
            </div>
          </div>
        </div>
    </div>
  );
}
