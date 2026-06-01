import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientLayout } from "../../components/dashboard/DashboardClientLayout";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // getUser() validates the JWT with Supabase's server — never use getSession() here
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Pass minimal display data so the nav can render before AuthProvider syncs
  const initialUser = {
    id: user.id,
    email: user.email ?? "",
    full_name:
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User",
    avatar_url:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      undefined,
  };

  return (
    <DashboardClientLayout initialUser={initialUser}>
      {children}
    </DashboardClientLayout>
  );
}
