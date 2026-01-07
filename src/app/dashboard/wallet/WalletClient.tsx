// src/app/dashboard/wallet/WalletClient.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  History,
  PlusCircle,
  Shield,
  AlertCircle,
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
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] =
    useState<WalletTransaction[]>(initialTransactions);
  const supabase = createClient();

  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      // FIX: Fetch the session properly before setting up the filter
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel("wallet-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "wallet_transactions",
            filter: `user_id=eq.${session.user.id}`, // Use the resolved session ID
          },
          () => {
            fetchTransactions();
          },
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (txns) {
        setTransactions(txns);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const totalCredit = transactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending",
  );

  return (
    <>
      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Current Balance</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                Rs. {balance.toFixed(2)}
              </p>
            </div>
            <Wallet className="h-10 w-10 text-indigo-600 opacity-80" />
          </div>
          <Link
            href="/dashboard/wallet/topup"
            className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Add Funds
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Credit</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                Rs. {totalCredit.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">All time credits</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Spent</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                Rs. {totalDebit.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">All time purchases</p>
            </div>
            <Shield className="h-10 w-10 text-blue-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2">
          {/* Pending Transactions Alert */}
          {pendingTransactions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">
                    You have {pendingTransactions.length} pending transaction
                    {pendingTransactions.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    These will be processed within 1-2 hours
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                Recent Transactions
              </h2>
              <Link
                href="/dashboard/wallet/transactions"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All →
              </Link>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "credit"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "credit" ? (
                            <PlusCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <History className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {transaction.description}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}Rs.{" "}
                        {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-500">
                        Status:{" "}
                        <span
                          className={`font-medium ${
                            transaction.status === "completed"
                              ? "text-green-600"
                              : transaction.status === "pending"
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No transactions yet
                </h3>
                <p className="text-slate-600">
                  Your transaction history will appear here
                </p>
                <Link
                  href="/dashboard/wallet/topup"
                  className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
                >
                  Make Your First Transaction
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/wallet/topup"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <PlusCircle className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Add Funds</p>
                  <p className="text-sm text-slate-500">Top up your wallet</p>
                </div>
              </Link>
              <Link
                href="/dashboard/wallet/transactions"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">View History</p>
                  <p className="text-sm text-slate-500">All transactions</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <p className="text-sm opacity-90 mb-4">
              Having issues with your wallet? Contact our support team.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="opacity-80">WhatsApp:</span>
                <span className="font-medium">+977 9846908072</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="opacity-80">Email:</span>
                <span className="font-medium">support@tronlinebazar.com</span>
              </p>
            </div>
            <button className="mt-4 w-full bg-white text-indigo-600 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
