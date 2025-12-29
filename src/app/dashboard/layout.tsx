// src/app/dashboard/layout.tsx
"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import { Home, ShoppingBag, Wallet, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Fixed at Top */}
      <DashboardNav navItems={navItems} />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {children}
      </main>
    </div>
  );
}
