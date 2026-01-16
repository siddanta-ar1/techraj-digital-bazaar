import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Exchange Code
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user to update DB
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure user exists in table
        await supabase.from("users").upsert(
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name,
            // Don't overwrite wallet_balance if it exists (use upsert carefully or check existance)
            // Ideally, set default in DB schema, but this is fine for now if it preserves data.
            // Note: Upsert with just these fields might overwrite wallet if you aren't careful.
            // Better to just ensure the row exists.
            role: "user",
          },
          { onConflict: "id", ignoreDuplicates: true },
        ); // Prevent overwriting wallet/data

        // Update specific fields if needed (like name)
        await supabase
          .from("users")
          .update({
            full_name: user.user_metadata.full_name,
            email: user.email,
          })
          .eq("id", user.id);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } else {
      console.error("Auth Callback Error:", error);
      // Redirect to login with error
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin,
        ),
      );
    }
  }

  // No code present
  return NextResponse.redirect(
    new URL("/login?error=no_code", requestUrl.origin),
  );
}
