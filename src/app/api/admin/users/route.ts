import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// Explicit allowlist — prevents mass assignment of wallet_balance, id, etc.
const ALLOWED_USER_UPDATES = new Set<string>([
  "full_name",
  "phone",
  "role",
  "email_verified",
]);

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;
    const { user: adminUser, admin } = ctx;

    const { id, ...rawUpdates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    // Strip any fields not on the allowlist before touching the DB
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawUpdates)) {
      if (ALLOWED_USER_UPDATES.has(key)) updates[key] = rawUpdates[key];
    }
    if (Object.keys(updates).length === 0)
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );


    // Prevent self-demotion — an admin who demotes themselves loses all admin access
    if (
      updates.role !== undefined &&
      updates.role !== "admin" &&
      id === adminUser!.id
    )
      return NextResponse.json(
        { error: "You cannot demote your own account" },
        { status: 400 },
      );

    // If updating role, sync Supabase Auth app_metadata so middleware/verifyAdmin checks work.
    if (updates.role !== undefined) {
      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        app_metadata: { role: updates.role },
      });
      if (authError) throw authError;
    }

    const { data, error } = await admin
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ user: data });
  } catch (error: any) {
    console.error("[admin/users] PATCH error:", error.message);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
