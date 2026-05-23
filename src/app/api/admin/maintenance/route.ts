import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Admin sets maintenance mode → stores in DB and sets a fast-check cookie.
// Middleware reads the cookie so it never needs a DB query per request.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.app_metadata?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { active } = await request.json();

    // Persist to DB using service-role client (site_settings is RLS-restricted)
    const adminDb = createAdminClient();
    await adminDb.from("site_settings").upsert({
      key: "maintenance",
      value: { active: !!active },
      updated_at: new Date().toISOString(),
    });

    const res = NextResponse.json({ success: true, active: !!active });

    // Set / clear a server-side cookie so middleware can check without a DB query
    if (active) {
      res.cookies.set("__maintenance", "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year — cleared explicitly on disable
      });
    } else {
      res.cookies.set("__maintenance", "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return res;
  } catch (error: any) {
    console.error("[admin/maintenance] error:", error.message);
    return NextResponse.json({ error: "Failed to update maintenance mode" }, { status: 500 });
  }
}
