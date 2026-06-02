import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

const ALLOWED_VARIANT_UPDATES = new Set<string>([
  "variant_name", "price", "original_price", "sku",
  "stock_type", "stock_quantity", "is_active", "sort_order",
]);

function validateVariantFields(fields: Record<string, unknown>): string | null {
  if ("price" in fields) {
    const p = Number(fields.price);
    if (!Number.isFinite(p) || p <= 0) return "Price must be a positive number";
  }
  if ("original_price" in fields && fields.original_price != null) {
    const op = Number(fields.original_price);
    if (!Number.isFinite(op) || op <= 0) return "Original price must be a positive number";
  }
  if ("stock_quantity" in fields) {
    const sq = Number(fields.stock_quantity);
    if (!Number.isInteger(sq) || sq < 0) return "Stock quantity must be a non-negative integer";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();

    const validationError = validateVariantFields(body);
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });

    const { admin } = ctx;
    const { data, error } = await admin
      .from("product_variants")
      .insert([body])
      .select();

    if (error) throw error;
    return NextResponse.json({ variants: data });
  } catch (error: any) {
    console.error("[admin/variants] POST error:", error.message);
    return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, ...rawUpdates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing variant id" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawUpdates)) {
      if (ALLOWED_VARIANT_UPDATES.has(key)) updates[key] = rawUpdates[key];
    }
    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    const validationError = validateVariantFields(updates);
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });

    const { admin } = ctx;
    const { data, error } = await admin
      .from("product_variants")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json({ variants: data });
  } catch (error: any) {
    console.error("[admin/variants] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update variant" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing variant id" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("product_variants").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
