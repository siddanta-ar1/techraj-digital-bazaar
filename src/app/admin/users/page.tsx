import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";

export const metadata = {
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500 mt-2">
          Manage user roles, balances, and accounts
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <UsersClient initialUsers={users || []} />
      </div>
    </div>
  );
}
