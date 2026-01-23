import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientLayout } from "../../components/dashboard/DashboardClientLayout";

// Force dynamic rendering for auth checks
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Server-side auth check - instant redirect for unauthenticated users
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // If we reach here, user is authenticated
  // Pass the session to client layout for UI state
  return (
    <DashboardClientLayout session={session}>{children}</DashboardClientLayout>
  );
}
