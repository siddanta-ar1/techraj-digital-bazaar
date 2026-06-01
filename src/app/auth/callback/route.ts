import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  try {
    const supabase = await createClient();

    // Exchange OAuth/magic-link code for a session
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[auth/callback] exchange error:", exchangeError.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin),
      );
    }

    const { session, user } = sessionData;

    if (!session || !user) {
      return NextResponse.redirect(
        new URL("/login?error=session_failed", origin),
      );
    }

    // Upsert user profile using admin client so RLS never blocks this.
    // This handles both new OAuth sign-ups and returning users.
    try {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("users")
        .select("id, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await admin.from("users").insert({
          id: user.id,
          email: user.email,
          full_name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          wallet_balance: 0,
          role: "user",
        });
        if (insertError) {
          console.error("[auth/callback] profile insert failed:", insertError.message);
        }
      } else {
        const updates: Record<string, any> = { email: user.email };
        if (user.user_metadata?.full_name) {
          updates.full_name = user.user_metadata.full_name;
        }
        await admin.from("users").update(updates).eq("id", user.id);
      }
    } catch (dbError: any) {
      // Never fail login due to DB issues — user can still proceed
      console.error("[auth/callback] profile upsert error:", dbError?.message);
    }

    return NextResponse.redirect(new URL(next, origin));
  } catch (error: any) {
    console.error("[auth/callback] unexpected error:", error?.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Authentication failed")}`, origin),
    );
  }
}
