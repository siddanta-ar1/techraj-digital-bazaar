import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

// GET ?slug=...&excludeId=... — slug uniqueness check
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId") || "";

    if (!slug)
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .neq("id", excludeId);

    return NextResponse.json({ exists: (data?.length ?? 0) > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("products")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...updates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
