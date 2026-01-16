"use client";

import {
  Menu,
  ShoppingCart,
  User,
  Wallet,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useCart } from "@/contexts/CartContext";
import SearchWithDropdown from "@/components/layout/SearchWithDropdown";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      {/* Top Info Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-default">
              📍 Bharatpur, Chitwan
            </span>
            <span className="hidden md:flex items-center gap-1 hover:text-white transition-colors">
              📞 +977-9846908072
            </span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            {user ? (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-0.5 rounded-full">
                <Wallet className="w-3.5 h-3.5" />
                {/* FIX: Check is_synced to prevent 0 flash */}
                {user.is_synced ? (
                  <span>रु {user.wallet_balance.toFixed(2)}</span>
                ) : (
                  <div className="w-12 h-3.5 bg-emerald-400/20 animate-pulse rounded" />
                )}
              </div>
            ) : (
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">
                  Support
                </a>
                <div className="w-px h-4 bg-slate-700"></div>
                <a href="#" className="hover:text-white transition-colors">
                  Faq
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="text-2xl font-black tracking-tighter">
              <span className="text-indigo-600">TECH</span>
              <span className="text-slate-800">RAJ</span>
              <span className="text-amber-500 text-xl">.NP</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Products
            </Link>
            <Link
              href="/category/games"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Game Codes
            </Link>
            <Link
              href="/category/gift-cards"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Gift Cards
            </Link>
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-64 lg:w-72">
              <SearchWithDropdown />
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="p-2.5 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-full relative transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-slate-50 rounded-full border border-transparent hover:border-slate-200 transition-all"
                >
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-200">
                    {user.full_name?.charAt(0) ||
                      user.email.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-50 mb-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 mx-2 rounded-lg transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/wallet"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 mx-2 rounded-lg transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Wallet className="w-4 h-4" />
                      Wallet{" "}
                      <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {/* FIX: Check is_synced here too */}
                        {user.is_synced ? (
                          `रु ${(user.wallet_balance ?? 0).toFixed(0)}`
                        ) : (
                          <div className="w-8 h-3 bg-slate-200 animate-pulse rounded inline-block" />
                        )}
                      </span>
                    </Link>

                    <div className="h-px bg-slate-100 my-2 mx-2"></div>

                    <button
                      onClick={() => {
                        signOut();
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 mx-2 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className="py-3 px-4 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-medium"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="py-3 px-4 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-medium"
              >
                Products
              </Link>
              <Link
                href="/category/games"
                className="py-3 px-4 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-medium"
              >
                Game Codes
              </Link>
              <Link
                href="/dashboard"
                className="py-3 px-4 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-medium"
              >
                Dashboard
              </Link>

              {!user && (
                <Link
                  href="/login"
                  className="mt-4 mx-4 py-3 bg-indigo-600 text-white rounded-lg text-center font-bold"
                >
                  Sign In
                </Link>
              )}

              {user && (
                <div className="mt-4 border-t border-slate-100 pt-4 px-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {user.full_name || "User"}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold min-w-[80px] text-center">
                      {/* FIX: Check is_synced */}
                      {user.is_synced ? (
                        `रु ${(user.wallet_balance ?? 0).toFixed(2)}`
                      ) : (
                        <div className="w-10 h-4 bg-emerald-700/20 animate-pulse rounded mx-auto" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full py-3 px-4 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-center font-semibold transition"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
