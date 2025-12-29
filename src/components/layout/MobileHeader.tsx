"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Added usePathname
import {
  Menu,
  ShoppingCart,
  X,
  User,
  Wallet,
  LogOut,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/lib/providers/AuthProvider";
import SearchWithDropdown from "./SearchWithDropdown";

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const pathname = usePathname(); // Get current path

  // FIX: Hide Mobile Header on Dashboard/Admin pages to prevent conflict with DashboardNav
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div className="bg-white pb-2">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="text-xl font-black tracking-tight">
              <span className="text-indigo-600">TECH</span>
              <span className="text-slate-800">RAJ</span>
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-1 -mr-1 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Real Search Component */}
          <div className="relative z-10">
            <SearchWithDropdown />
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="font-bold text-lg text-slate-800">Menu</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* User Profile Section (Inside Menu) */}
            {user ? (
              <div className="p-5 bg-indigo-50/50 border-b border-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
                    {user.full_name?.charAt(0) ||
                      user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/dashboard/wallet"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center p-3 bg-white rounded-xl border border-indigo-100 shadow-sm"
                  >
                    <span className="text-xs text-slate-500 mb-1">Balance</span>
                    <span className="font-bold text-emerald-600">
                      Rs. {user.wallet_balance.toFixed(0)}
                    </span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200"
                  >
                    <span className="text-xs font-medium">Dashboard</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-sm text-slate-600 mb-3">
                  Login to access wallet & orders
                </p>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center justify-center py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Sign In / Register
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <div className="p-4 space-y-1">
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Browse
              </p>

              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
              >
                Home <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
              >
                All Products <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/products?featured=true"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
              >
                Featured Items{" "}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <div className="h-px bg-slate-100 my-2" />

              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Categories
              </p>

              <Link
                href="/category/games"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
              >
                Game Top-ups <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/category/gift-cards"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
              >
                Gift Cards <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Drawer Footer */}
          {user && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-3 text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
