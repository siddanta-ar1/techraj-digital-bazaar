import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";
import { Users } from "lucide-react";
import UsersHeader from "./UsersHeader";
import { Metadata } from "next";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            User Management
          </h1>
          <p className="text-slate-500 mt-2">
            Manage user roles, balances, and accounts
          </p>
        </div>
        <UsersHeader users={users || []} />
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: users?.length || 0,
            color: "bg-blue-500",
            icon: Users,
            iconColor: "text-blue-600",
            iconBg: "bg-blue-50",
          },
          {
            label: "Admin Users",
            value: users?.filter((u) => u.role === "admin").length || 0,
            color: "bg-purple-500",
            icon: Users,
            iconColor: "text-purple-600",
            iconBg: "bg-purple-50",
          },
          {
            label: "Verified Users",
            value: users?.filter((u) => u.email_verified).length || 0,
            color: "bg-green-500",
            icon: Users,
            iconColor: "text-green-600",
            iconBg: "bg-green-50",
          },
          {
            label: "Total Wallet Balance",
            value: `Rs. ${users?.reduce((sum, u) => sum + (u.wallet_balance || 0), 0).toFixed(2) || "0.00"}`,
            color: "bg-emerald-500",
            icon: Users,
            iconColor: "text-emerald-600",
            iconBg: "bg-emerald-50",
          },
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 ${stat.iconBg} rounded-xl`}>
                  <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <UsersClient initialUsers={users || []} />
      </div>
    </div>
  );
}
