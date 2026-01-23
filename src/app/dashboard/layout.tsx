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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 2. Safety Gate: If not loading, but no user, return null
  // This prevents the protected content from flashing before the router.replace kicks in.
  if (!user) return null;

  // 3. Render Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNav navItems={navItems} />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {children}
      </main>
    </div>
  );
}
