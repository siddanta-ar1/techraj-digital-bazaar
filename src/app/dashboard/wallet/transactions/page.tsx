import type { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wallet Transactions | TechRaj Digital",
  description: "View your wallet transaction history",
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const admin = createAdminClient();
  const { data: transactions } = await admin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50); // Get last 50 transactions

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
        <p className="text-slate-500 mt-1">All your wallet credits and debits</p>
      </div>

      <TransactionsClient initialTransactions={transactions ?? []} />
    </div>
  );
}
