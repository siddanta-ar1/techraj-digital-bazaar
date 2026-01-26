"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  Home,
  ChevronDown,
  LayoutDashboard,
  Wallet,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { Session } from "@supabase/supabase-js";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardNavProps {
  navItems: NavItem[];
  session: Session;
}

export default function DashboardNav({ navItems, session }: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Use server session data for stable initial render, then use auth context if available
  const displayUser = useMemo(() => {
    // Prioritize synced auth context user, fallback to session data
    if (user?.is_synced) {
      return {
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        wallet_balance: user.wallet_balance,
      };
    }
    // Use server session data for stable initial render
    return {
      full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
      email: session.user.email || "",
      role: user?.role || "user", // Role comes from DB, use auth context if available
      wallet_balance: user?.wallet_balance ?? 0,
    };
  }, [user, session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter shrink-0 flex items-center"
            >
              <span className="text-indigo-600">TECH</span>
              <span className="text-slate-800">RAJ</span>
              <span className="text-amber-500 text-lg ml-0.5">.NP</span>
            </Link>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider hidden md:inline-block border border-slate-200">
              User Panel
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                    }`}
                >
                  <Icon
                    className={`h-4 w-4 mr-2.5 transition-colors ${isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-indigo-600"
                      }`}
                  />
                  {item.name}
                </Link>
              );
            })}

            {/* User Menu Dropdown */}
            <div
              className="relative ml-4 pl-4 border-l border-slate-200"
              ref={dropdownRef}
            >
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 py-1 pr-2 pl-1 rounded-full border border-transparent hover:border-slate-200 transition-all outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-50">
                  {displayUser.full_name?.charAt(0) ||
                    displayUser.email?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
                <ChevronDown
                  className={`hidden md:block w-4 h-4 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                    <p className="font-bold text-slate-800 truncate">
                      {displayUser.full_name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate font-medium">
                      {displayUser.email}
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      Back to Store
                    </Link>
                    {displayUser.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/dashboard/wallet"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors group"
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="flex-1">Wallet</span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                        {user?.is_synced ? (
                          `Rs. ${displayUser.wallet_balance.toFixed(0)}`
                        ) : (
                          <span className="inline-block w-8 h-2 bg-slate-200 animate-pulse rounded" />
                        )}
                      </span>
                    </Link>
                  </div>

                  <div className="my-1 border-t border-slate-50 p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[4rem] left-0 right-0 bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top-2 z-50 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 space-y-6">
            <div>
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Menu
              </p>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <Icon
                        className={`h-5 w-5 mr-3 ${isActive ? "text-indigo-600" : "text-slate-400"
                          }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Account
              </p>
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5 mr-3 text-slate-400" />
                  Store Home
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-base font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
