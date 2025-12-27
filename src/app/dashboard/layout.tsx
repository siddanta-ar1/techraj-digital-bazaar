import DashboardNav from "@/components/dashboard/DashboardNav";

const navItems = [
  { name: "Dashboard", href: "/dashboard", iconName: "home" },
  { name: "My Orders", href: "/dashboard/orders", iconName: "shopping-bag" },
  { name: "Wallet", href: "/dashboard/wallet", iconName: "wallet" },
  { name: "Settings", href: "/dashboard/settings", iconName: "settings" },
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
      {/* mt-16 pushes content below fixed navbar */}
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {children}
      </main>
    </div>
  );
}
