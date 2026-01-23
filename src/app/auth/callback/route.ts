import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;

  // Handle missing code
  if (!code) {
    console.error("Auth callback: No code provided");
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  try {
    const supabase = await createClient();

    // Exchange code for session
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Auth callback exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          origin,
        ),
      );
    }

    const { session, user } = sessionData;

    if (!session || !user) {
      console.error("Auth callback: No session or user after exchange");
      return NextResponse.redirect(
        new URL("/login?error=session_failed", origin),
      );
    }

    // Ensure user exists in database
    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("id", user.id)
        .single();

      if (!existingUser) {
        // Create new user record
        const { error: insertError } = await supabase.from("users").insert({
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
          console.error("Failed to create user record:", insertError);
          // Don't fail the login for database issues
        }
      } else {
        // Update existing user's metadata
        await supabase
          .from("users")
          .update({
            full_name: user.user_metadata?.full_name || existingUser.full_name,
            email: user.email,
          })
          .eq("id", user.id);
      }
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      // Continue with login even if DB operations fail
    }

    // Successful authentication - redirect to target page
    console.log("Auth callback successful, redirecting to:", next);
    return NextResponse.redirect(new URL(next, origin));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Authentication failed")}`,
        origin,
      ),
    );
  }
}
