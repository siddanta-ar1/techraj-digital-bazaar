"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Shield, User, Wallet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  wallet_balance: number;
  created_at: string;
}

export function UsersClient({ initialUsers }: { initialUsers: UserData[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // Modal Hooks
  const { modalState, closeModal, showSuccess, showError, showConfirm } =
    useModal();

  const handleRoleUpdate = async (
    userId: string,
    newRole: "user" | "admin",
  ) => {
    const action = newRole === "admin" ? "Promote to Admin" : "Demote to User";
    const message =
      newRole === "admin"
        ? "This user will have full access to the admin dashboard. Are you sure?"
        : "This user will lose access to admin features. Are you sure?";

    showConfirm(action, message, async () => {
      setLoading(userId);
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      setLoading(null);

      if (error) {
        showError("Update Failed", error.message);
      } else {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        showSuccess(
          "Role Updated",
          `User has been successfully ${newRole === "admin" ? "promoted" : "demoted"}.`,
        );
        router.refresh();
      }
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div>
        {/* Search Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">User Details</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Wallet Balance</th>
                <th className="px-6 py-4 font-bold">Joined</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 mb-2 opacity-20" />
                      <p>No users found matching "{search}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.email}
                              width={40}
                              height={40}
                              className="object-cover h-full w-full"
                            />
                          ) : (
                            <User className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {user.full_name || "No Name"}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 font-mono font-medium">
                        <Wallet className="h-4 w-4 text-slate-400" />
                        Rs. {user.wallet_balance?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {loading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        ) : user.role === "user" ? (
                          <button
                            onClick={() => handleRoleUpdate(user.id, "admin")}
                            className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleUpdate(user.id, "user")}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Demote
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        showConfirmButton={modalState.showConfirmButton}
      />
    </>
  );
}
