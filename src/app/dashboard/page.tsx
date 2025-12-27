"use client";

import { useAuth } from "@/lib/providers/AuthProvider";
import {
  Package,
  CreditCard,
  History,
  Settings,
  Wallet,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link href="/login" className="text-indigo-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Wallet Balance",
      value: `रु ${user.wallet_balance.toFixed(2)}`,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Orders",
      value: "0",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Orders",
      value: "0",
      icon: History,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completed Orders",
      value: "0",
      icon: CreditCard,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const quickActions = [
    {
      title: "My Orders",
      description: "View and track your orders",
      icon: Package,
      link: "/dashboard/orders",
    },
    {
      title: "Wallet Top-up",
      description: "Add funds to your wallet",
      icon: Wallet,
      link: "/dashboard/wallet",
    },
    {
      title: "Account Settings",
      description: "Update your profile",
      icon: Settings,
      link: "/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-indigo-100">
                Welcome back, {user.full_name || user.email.split("@")[0]}!
              </p>
            </div>
            <button
              onClick={signOut}
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bg} p-6 rounded-2xl border border-slate-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <span className="text-sm text-slate-600">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.link}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <action.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Recent Activity
          </h2>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No activity yet
            </h3>
            <p className="text-slate-600 mb-6">
              Your recent orders and transactions will appear here
            </p>
            <Link
              href="/products"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
