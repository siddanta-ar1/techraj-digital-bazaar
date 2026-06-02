import type { User } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type AdminClient = ReturnType<typeof createAdminClient>;

export interface AdminContext {
  user: User;
  admin: AdminClient;
}

/**
 * Shared admin auth helper for all /api/admin/* routes.
 *
 * Returns { user, admin } on success, or a ready-to-return 401/403
 * NextResponse on failure. Including the admin client in the return
 * value eliminates the repeated createAdminClient() call in every handler.
 *
 * Usage:
 *   const ctx = await requireAdmin();
 *   if (ctx instanceof NextResponse) return ctx;
 *   const { user, admin } = ctx;
 */
export async function requireAdmin(): Promise<AdminContext | NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { user, admin: createAdminClient() };
}
