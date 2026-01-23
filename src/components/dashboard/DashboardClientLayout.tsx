"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import { Home, ShoppingBag, Wallet, Settings } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  session: Session;
}

export function DashboardClientLayout({
  children,
  session,
}: DashboardClientLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNav navItems={navItems} />
      {/* Added pt-20 to account for fixed header */}
      <main className="flex-1 w-full pt-20">{children}</main>
    </div>
  );
}
