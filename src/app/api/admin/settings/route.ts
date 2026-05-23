import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

// GET — fetch all settings as key→value map
export async function GET() {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = createAdminClient();
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
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { key, value } = await request.json();
    if (!key)
      return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const admin = createAdminClient();
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
