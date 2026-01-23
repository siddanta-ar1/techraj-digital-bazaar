"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import { Home, ShoppingBag, Wallet, Settings, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if explicitly NOT loading and user is missing
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // 1. Show Loader: Only when genuinely loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-lg">
          Verifying session...
        </p>
      </div>
    );
  }

  // 2. Safety Gate
  if (!user) return null;

  // 3. Render Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNav navItems={navItems} />
      {/* Added pt-20 to account for fixed header */}
      <main className="flex-1 w-full pt-20">{children}</main>
    </div>
  );
}
