"use client";

import { useAuth } from "@/lib/providers/AuthProvider";
import {
  Package,
  CreditCard,
  History,
  Settings,
  Wallet,
  LogOut,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  // Layout handles loading and auth checks, so we can safely assume user exists here
  if (!user) return null;

  // 2. Show "Sign In" only if explicitly not logged in (fallback)
  if (!user) {
    return null; // The useEffect above handles the redirect, so we return null to avoid flash
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg rounded-2xl mb-8">
        <div className="px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back, {user.full_name || user.email?.split("@")[0]}!
              </p>
            </div>
            <button
              onClick={signOut}
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Wallet Balance
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {/* FIX: Handle null/undefined safely */}
            रु {(user.wallet_balance ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Total Orders
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">0</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <History className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Pending Orders
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">0</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Completed Orders
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">0</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/orders"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Package className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  My Orders
                </h3>
                <p className="text-sm text-slate-500">View and track orders</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/wallet"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Wallet className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Wallet Top-up
                </h3>
                <p className="text-sm text-slate-500">Add funds</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Settings className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-slate-500">Update profile</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Recent Activity
        </h2>
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No activity yet
          </h3>
          <p className="text-slate-500 mb-6">
            Your recent orders will appear here
          </p>
          <Link
            href="/products"
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
