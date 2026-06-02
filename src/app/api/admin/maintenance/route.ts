import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// Admin sets maintenance mode → stores in DB and sets a fast-check cookie.
// Middleware reads the cookie so it never needs a DB query per request.
export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;
    const { admin } = ctx;

    const { active } = await request.json();

    await admin.from("site_settings").upsert({
      key: "maintenance",
      value: { active: !!active },
      updated_at: new Date().toISOString(),
    });

    const res = NextResponse.json({ success: true, active: !!active });

    // Set / clear a server-side cookie so middleware can check without a DB query
    const isProd = process.env.NODE_ENV === "production";
    if (active) {
      res.cookies.set("__maintenance", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } else {
      res.cookies.set("__maintenance", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
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
