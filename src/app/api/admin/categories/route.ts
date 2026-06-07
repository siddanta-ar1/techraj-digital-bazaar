import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

const ALLOWED_CATEGORY_FIELDS = new Set([
  "name", "slug", "description", "image_url", "is_active", "sort_order",
]);

function pickCategoryFields(raw: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of ALLOWED_CATEGORY_FIELDS) {
    if (key in raw) safe[key] = raw[key];
  }
  return safe;
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const raw = await request.json();
    const body = pickCategoryFields(raw);
    if (!body.name || !body.slug)
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });

    const { admin } = ctx;

    const { data, error } = await admin
      .from("categories")
      .insert([body])
      .select("*, products(count)")
      .single();

    if (error) throw error;
    return NextResponse.json({ category: data });
  } catch (error: any) {
    if (error.code === "23505")
      return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, ...raw } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing category id" }, { status: 400 });

    const updates = pickCategoryFields(raw);
    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    const { admin } = ctx;
    const { data, error } = await admin
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select("*, products(count)")
      .single();

    if (error) throw error;
    return NextResponse.json({ category: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing category id" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("categories").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
