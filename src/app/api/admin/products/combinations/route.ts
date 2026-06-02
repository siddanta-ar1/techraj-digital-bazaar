import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// GET ?productId=... — fetch groups+options and combinations for a product
export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId)
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const { admin } = ctx;

    const [{ data: groups }, { data: combos }] = await Promise.all([
      admin
        .from("product_option_groups")
        .select("*, option_group:option_groups(*, options:options(*))")
        .eq("product_id", productId)
        .order("sort_order"),
      admin
        .from("option_combinations")
        .select("*")
        .eq("product_id", productId)
        .order("created_at"),
    ]);

    return NextResponse.json({ groups: groups || [], combinations: combos || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — bulk insert combinations
export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { combinations } = await request.json();
    if (!Array.isArray(combinations) || combinations.length === 0)
      return NextResponse.json({ error: "No combinations provided" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("option_combinations").insert(combinations);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — update a single combination field
export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, field, value } = await request.json();
    if (!id || !field)
      return NextResponse.json({ error: "Missing id or field" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin
      .from("option_combinations")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE ?id=...
export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("option_combinations").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
