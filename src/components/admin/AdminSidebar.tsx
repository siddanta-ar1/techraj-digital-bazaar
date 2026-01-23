"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
  Home,
  Wallet,
  Layers, // Icon for Categories
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Layers }, // Added
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Promo Codes", href: "/admin/promos", icon: Tag },
  { name: "Wallet Requests", href: "/admin/wallet", icon: Wallet },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl">
      <div className="flex h-16 items-center px-6 font-bold text-xl tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          TECHRAJ ADMIN
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 px-3 py-6 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg transform scale-105"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:transform hover:scale-102"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${isActive ? "bg-white/20" : "bg-slate-700/50"}`}
              >
                <item.icon className="h-4 w-4" />
              </div>
              {item.name}
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-xl transition-all duration-200 hover:transform hover:scale-102"
        >
          <div className="p-1.5 rounded-lg bg-red-500/20">
            <LogOut className="h-4 w-4" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );
}
