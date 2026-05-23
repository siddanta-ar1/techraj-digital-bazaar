import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("product_variants")
      .insert([body])
      .select();

    if (error) throw error;
    return NextResponse.json({ variants: data });
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
      return NextResponse.json({ error: "Missing variant id" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("product_variants")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json({ variants: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing variant id" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("product_variants").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
