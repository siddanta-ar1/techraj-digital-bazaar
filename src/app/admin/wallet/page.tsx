import { createClient } from "@/lib/supabase/server";
import { TopupRequestTable } from "@/components/admin/TopupRequestTable";
import { Wallet } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-indigo-600" />
            Wallet Management
          </h1>
          <p className="text-slate-500 mt-2">
            Manage user top-up requests and balance
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pending Requests</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pending Value</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            Rs. {pendingAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Recent Requests</h2>
        </div>
        <TopupRequestTable initialRequests={requests || []} />
      </div>
    </div>
  );
}
