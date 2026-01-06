"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import { Home, ShoppingBag, Wallet, Settings, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

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

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("🔒 No user found, redirecting to login...");
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user (brief moment before redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <h1 className="text-2xl font-bold mb-2 text-slate-900">
            Authentication Required
          </h1>
          <p className="text-slate-600 mb-6">Redirecting to login...</p>
          <Link
            href="/login"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // User is authenticated, render the dashboard layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNav navItems={navItems} />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {children}
      </main>
    </div>
  );
}
