import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // FIX: Use getUser() instead of getSession() for better security
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");
  if (user.app_metadata?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:block border-r border-slate-200">
        <AdminSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
