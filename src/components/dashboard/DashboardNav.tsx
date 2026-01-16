"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  Home,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/providers/AuthProvider";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardNavProps {
  navItems: NavItem[];
}

export default function DashboardNav({ navItems }: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

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
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-[60] shadow-sm">
      <div className="container mx-auto px-4">
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
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hidden md:inline-block border border-indigo-100">
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
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 mr-2.5 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"}`}
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
                className="flex items-center gap-2 hover:bg-slate-50 py-1 pr-2 pl-1 rounded-full border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-50">
                  {user?.full_name?.charAt(0) ||
                    user?.email?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
                <ChevronDown
                  className={`hidden md:block w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 rounded-t-2xl">
                    <p className="font-bold text-slate-800 truncate">
                      {user?.full_name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      Back to Store
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/dashboard/wallet"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="flex-1">Wallet</span>
                      <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {/* FIX: Check is_synced */}
                        {user?.is_synced ? (
                          `Rs. ${user?.wallet_balance.toFixed(0)}`
                        ) : (
                          <span className="inline-block w-6 h-3 bg-slate-200 animate-pulse rounded" />
                        )}
                      </span>
                    </Link>
                  </div>

                  <div className="my-1 border-t border-slate-50 p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left font-medium"
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
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
              {user?.full_name?.charAt(0) ||
                user?.email?.charAt(0).toUpperCase()}
            </div>
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

      {/* Mobile Navigation Drawer - (Content kept same as your request, logic mirrors desktop) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[4rem] left-0 right-0 bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top-2 z-50 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 space-y-6">
            <div>
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Main Menu
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
                      className={`flex items-center px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 mr-3 ${isActive ? "text-white" : "text-slate-400"}`}
                      />
                      {item.name}
                      {isActive && (
                        <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Account & Settings
              </p>
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center px-4 py-3.5 rounded-2xl text-base font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5 mr-3 text-slate-400" />
                  Back to Store
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-3.5 rounded-2xl text-base font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
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
