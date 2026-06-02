import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// GET ?productId=... — fetch assigned groups + available global groups
export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId)
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const admin = createAdminClient();

    const [{ data: assigned }, { data: allGroups }] = await Promise.all([
      admin
        .from("product_option_groups")
        .select("*, option_group:option_groups(*)")
        .eq("product_id", productId)
        .order("sort_order"),
      admin
        .from("option_groups")
        .select("*")
        .eq("is_global", true)
        .eq("is_active", true)
        .order("name"),
    ]);

    const assignedIds = new Set((assigned || []).map((a: any) => a.group_id));
    const available = (allGroups || []).filter((g: any) => !assignedIds.has(g.id));

    return NextResponse.json({ assigned: assigned || [], available });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — link an option group to a product
export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const admin = createAdminClient();

    const { error } = await admin.from("product_option_groups").insert([body]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — update a product_option_group row (e.g. toggle is_required)
export async function PATCH(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const { id, ...updates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("product_option_groups")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE ?id=... — unlink option group from product
export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("product_option_groups").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
