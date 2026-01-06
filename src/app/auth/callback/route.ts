import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
      // Ensure the record exists in your custom 'users' table immediately
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata.full_name,
        wallet_balance: 0,
        role: "user",
      });
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
