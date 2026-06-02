import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// GET — fetch all settings as key→value map
export async function GET() {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;
    const { admin } = ctx;
    const { data, error } = await admin.from("site_settings").select("*");
    if (error) throw error;

    const map: Record<string, any> = {};
    data?.forEach((item: any) => { map[item.key] = item.value; });
    return NextResponse.json({ settings: map });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — upsert a single setting by key
export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { key, value } = await request.json();
    if (!key || typeof key !== "string")
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 400 });

    // Only allow known settings keys — prevents arbitrary DB row injection
    const ALLOWED_SETTINGS_KEYS = new Set(["payment_methods"]);
    if (!ALLOWED_SETTINGS_KEYS.has(key))
      return NextResponse.json({ error: "Unknown settings key" }, { status: 400 });

    // Cap value payload at 64 KB serialised — prevents storage abuse
    const serialised = JSON.stringify(value);
    if (serialised.length > 65536)
      return NextResponse.json({ error: "Settings value too large" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("site_settings").upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
