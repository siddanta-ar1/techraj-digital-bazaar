"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  ShoppingBag,
  PlusCircle,
  History,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WalletTransaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  transaction_type: string;
  description: string;
  balance_after: number;
  status: string;
  created_at: string;
}

interface WalletClientProps {
  initialBalance: number;
  initialTransactions: WalletTransaction[];
}

export default function WalletClient({
  initialBalance,
  initialTransactions,
}: WalletClientProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const totalCredit = initialTransactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = initialTransactions
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = initialTransactions.filter(
    (t) => t.status === "pending",
  ).length;

  // Realtime: refresh server data instead of querying the DB from the client.
  // Uses a cancellation flag so that if the component unmounts while getUser()
  // is still in-flight, the async setup() sees isCancelled=true and never
  // subscribes — avoiding the channel leak where cleanup fires with
  // channel=undefined but setup() completes post-unmount and creates an
  // orphaned subscription that is never removed.
  useEffect(() => {
    let isCancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isCancelled || !user) return;

      channel = supabase
        .channel("wallet-realtime")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${user.id}`,
        }, () => router.refresh())
        .subscribe();
    };

    setup();
    return () => {
      isCancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const statusStyle = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    failed:    "bg-red-50 text-red-700 border-red-200",
  } as Record<string, string>;

  return (
    <>
      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* Balance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl shrink-0">
            <Wallet className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500 font-medium">Current Balance</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">
              Rs. {initialBalance.toFixed(2)}
            </p>
            <Link
              href="/dashboard/wallet/topup"
              className="inline-flex items-center gap-1 text-indigo-600 text-xs font-semibold mt-1 hover:text-indigo-700"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Funds
            </Link>
          </div>
        </div>

        {/* Total Credits */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500 font-medium">Total Credits</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">
              Rs. {totalCredit.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 mt-1">All-time top-ups</p>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-xl shrink-0">
            <ShoppingBag className="w-6 h-6 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500 font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">
              Rs. {totalDebit.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 mt-1">All-time purchases</p>
          </div>
        </div>
      </div>

      {/* ── Pending alert ──────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Usually processed within 1–2 hours
            </p>
          </div>
        </div>
      )}

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-indigo-600" />
              Recent Transactions
            </h2>
            <Link
              href="/dashboard/wallet/transactions"
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {initialTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {initialTransactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        t.type === "credit"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {t.type === "credit" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {t.description || "Wallet Transaction"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(t.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-bold text-sm ${
                        t.type === "credit" ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {t.type === "credit" ? "+" : "−"}Rs.{" "}
                      {t.amount.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border mt-1 ${
                        statusStyle[t.status] ?? "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <History className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-900 mb-1">No transactions yet</p>
              <p className="text-sm text-slate-500 mb-5">
                Top up your wallet to get started
              </p>
              <Link
                href="/dashboard/wallet/topup"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700"
              >
                <PlusCircle className="w-4 h-4" /> Add Funds
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-4 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/wallet/topup"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Add Funds</p>
                  <p className="text-xs text-slate-500">Top up your wallet</p>
                </div>
              </Link>
              <Link
                href="/dashboard/wallet/transactions"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <History className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Full History</p>
                  <p className="text-xs text-slate-500">All transactions</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Support card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 opacity-80" />
                <h3 className="font-bold text-sm">Need Help?</h3>
              </div>
              <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
                Having issues with your wallet? Our support team is ready to help.
              </p>
              <div className="text-xs space-y-1.5 mb-4">
                <p className="text-indigo-200">WhatsApp · <span className="text-white font-medium">+977 9846908072</span></p>
                <p className="text-indigo-200">Email · <span className="text-white font-medium">techraj687yt@gmail.com</span></p>
              </div>
              <a
                href="https://wa.me/9779846908072"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-white text-indigo-700 text-sm font-bold py-2 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Contact on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
