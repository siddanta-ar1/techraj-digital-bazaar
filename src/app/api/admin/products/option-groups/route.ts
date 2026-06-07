import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// GET ?productId=... — fetch assigned groups + available global groups
export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId)
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const { admin } = ctx;

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

const ALLOWED_POG_INSERT = new Set(["product_id", "group_id", "sort_order", "is_required"]);
const ALLOWED_POG_UPDATE = new Set(["sort_order", "is_required"]);

// POST — link an option group to a product
export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const raw = await request.json();
    if (!raw.product_id || !raw.group_id)
      return NextResponse.json({ error: "product_id and group_id are required" }, { status: 400 });

    const body: Record<string, unknown> = {};
    for (const key of ALLOWED_POG_INSERT) {
      if (key in raw) body[key] = raw[key];
    }

    const { admin } = ctx;

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
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, ...raw } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_POG_UPDATE) {
      if (key in raw) updates[key] = raw[key];
    }
    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    const { admin } = ctx;
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
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("product_option_groups").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
