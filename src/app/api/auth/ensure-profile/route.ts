import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Called immediately after email/password sign-up to create the public.users
 * profile record using the admin client (bypasses RLS).
 *
 * The browser client cannot reliably write to public.users after signup
 * because RLS policies may not yet recognise the brand-new JWT.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Upsert — safe to call multiple times (idempotent)
    const { error } = await admin.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User",
        wallet_balance: 0,
        role: "user",
      },
      { onConflict: "id", ignoreDuplicates: false },
    );

    if (error) {
      console.error("[ensure-profile] upsert error:", error.message);
      return NextResponse.json({ error: "Profile creation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[ensure-profile] unexpected error:", err?.message);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
