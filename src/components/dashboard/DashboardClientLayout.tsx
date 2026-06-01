"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import { Home, ShoppingBag, Wallet, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export interface InitialUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  initialUser: InitialUser;
}

export function DashboardClientLayout({
  children,
  initialUser,
}: DashboardClientLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNav navItems={navItems} initialUser={initialUser} />
      <main className="flex-1 w-full pt-20">{children}</main>
    </div>
  );
}
