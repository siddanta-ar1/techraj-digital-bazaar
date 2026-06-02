import { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wallet – Techraj Digital",
  description: "Manage your wallet balance and transaction history",
};

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: profile }, { data: recentTransactions }] = await Promise.all([
    admin.from("users").select("wallet_balance").eq("id", user.id).single(),
    admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Wallet</h1>
        <p className="text-slate-500 mt-1">Manage your balance and transaction history</p>
      </div>

      <WalletClient
        initialBalance={profile?.wallet_balance ?? 0}
        initialTransactions={recentTransactions ?? []}
      />
    </div>
  );
}
