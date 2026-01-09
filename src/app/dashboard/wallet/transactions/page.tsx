import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export const metadata: Metadata = {
  title: "Wallet Transactions | TechRaj Digital",
  description: "View your wallet transaction history",
};

export default async function TransactionsPage() {
  const supabase = await createClient();

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Transactions (Fetch more than just the recent 10)
  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50); // Get last 50 transactions

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Transaction History
        </h1>
        <p className="text-slate-500">
          Track all your wallet credits and debits
        </p>
      </div>

      <TransactionsClient initialTransactions={transactions || []} />
    </div>
  );
}
