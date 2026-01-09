"use client";

import { useState } from "react";
import {
  History,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";

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

export default function TransactionsClient({
  initialTransactions,
}: {
  initialTransactions: WalletTransaction[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transaction_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Filters Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("credit")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "credit"
                ? "bg-green-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Credits
          </button>
          <button
            onClick={() => setFilter("debit")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "debit"
                ? "bg-red-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Debits
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-full flex-shrink-0 ${
                    transaction.type === "credit"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {transaction.type === "credit" ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {transaction.description || "Wallet Transaction"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500">
                    <span>
                      {new Date(transaction.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="capitalize">
                      {transaction.transaction_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right pl-14 sm:pl-0">
                <p
                  className={`text-lg font-bold ${
                    transaction.type === "credit"
                      ? "text-green-600"
                      : "text-slate-900"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  Rs. {transaction.amount.toFixed(2)}
                </p>
                <div className="flex items-center sm:justify-end gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      transaction.status === "completed"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : transaction.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {transaction.status.toUpperCase()}
                  </span>
                  {transaction.balance_after !== null && (
                    <span className="text-xs text-slate-400">
                      Bal: Rs. {transaction.balance_after.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            No transactions found
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            {searchTerm
              ? "Try adjusting your search or filters to find what you're looking for."
              : "You haven't made any wallet transactions yet."}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/wallet/topup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Funds Now
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
