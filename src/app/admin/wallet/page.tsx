import { createClient } from "@/lib/supabase/server";
import { TopupRequestTable } from "@/components/admin/TopupRequestTable";
import { Wallet, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Wallet Management - Admin Panel",
};

export default async function AdminWalletPage() {
  const supabase = await createClient();

  // Fetch pending requests first, then others
  const { data: requests } = await supabase
    .from("topup_requests")
    .select(
      `
      *,
      user:users(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Calculate pending stats
  const pendingCount =
    requests?.filter((r) => r.status === "pending").length || 0;
  const pendingAmount =
    requests
      ?.filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Wallet className="h-8 w-8 text-indigo-600" />
            </div>
            Wallet Management
          </h1>
          <p className="text-slate-500 mt-2">
            Review and process user wallet top-up requests.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              Recent Requests
            </h2>
          </div>
          <TopupRequestTable initialRequests={requests || []} />
        </div>
      </div>
    </div>
  );
}
