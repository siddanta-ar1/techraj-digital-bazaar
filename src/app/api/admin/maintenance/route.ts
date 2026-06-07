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

    return NextResponse.json({ success: true, active: !!active });
  } catch (error: any) {
    console.error("[admin/maintenance] error:", error.message);
    return NextResponse.json({ error: "Failed to update maintenance mode" }, { status: 500 });
  }
}
