import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";
import { Users, ShieldCheck, UserCheck, Wallet, Search } from "lucide-react";
import { Metadata } from "next";
import UsersHeader from "./UsersHeader";

export const metadata: Metadata = {
  title: "User Management - Admin Panel",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              User Management
            </h1>
            <p className="text-slate-500 mt-2">
              Manage user roles, balances, and account status.
            </p>
          </div>
          <UsersHeader users={users || []} />
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Users",
              value: users?.length || 0,
              icon: Users,
              iconColor: "text-blue-600",
              iconBg: "bg-blue-50",
            },
            {
              label: "Admin Users",
              value: users?.filter((u) => u.role === "admin").length || 0,
              icon: ShieldCheck,
              iconColor: "text-purple-600",
              iconBg: "bg-purple-50",
            },
            {
              label: "Verified Users",
              value: users?.filter((u) => u.email_verified).length || 0,
              icon: UserCheck,
              iconColor: "text-green-600",
              iconBg: "bg-green-50",
            },
            {
              label: "Total Wallet Balance",
              value: `Rs. ${
                users
                  ?.reduce((sum, u) => sum + (u.wallet_balance || 0), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2 }) ||
                "0.00"
              }`,
              icon: Wallet,
              iconColor: "text-emerald-600",
              iconBg: "bg-emerald-50",
            },
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 ${stat.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <UsersClient initialUsers={users || []} />
        </div>
      </div>
    </div>
  );
}
