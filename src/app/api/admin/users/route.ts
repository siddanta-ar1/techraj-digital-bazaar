import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...updates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const admin = createAdminClient();

    // If updating role, sync Supabase Auth app_metadata so middleware/verifyAdmin checks work.
    // Without this, the promoted user's JWT still carries the old role and admin access is denied.
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
