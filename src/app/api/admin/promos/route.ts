import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// usage_count is intentionally excluded — only RPCs (increment/decrement_promo_usage) should touch it
const ALLOWED_PROMO_FIELDS = new Set<string>([
  "code", "description", "discount_type", "discount_value",
  "min_order_amount", "max_discount_amount", "usage_limit",
  "expires_at", "is_active",
]);

const VALID_DISCOUNT_TYPES = new Set(["percentage", "fixed"]);

function validatePromoFields(raw: Record<string, unknown>): { error: string } | null {
  if (raw.discount_type !== undefined && !VALID_DISCOUNT_TYPES.has(raw.discount_type as string)) {
    return { error: "discount_type must be 'percentage' or 'fixed'" };
  }
  if (raw.discount_value !== undefined) {
    const v = Number(raw.discount_value);
    if (!Number.isFinite(v) || v <= 0) return { error: "discount_value must be a positive number" };
    if (raw.discount_type === "percentage" && v > 100) return { error: "Percentage discount cannot exceed 100" };
  }
  if (raw.min_order_amount !== undefined) {
    const v = Number(raw.min_order_amount);
    if (!Number.isFinite(v) || v < 0) return { error: "min_order_amount must be non-negative" };
  }
  return null;
}

export async function GET() {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;
    const { admin } = ctx;
    const { data, error } = await admin
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ promos: data });
  } catch (error: any) {
    console.error("[admin/promos] GET error:", error.message);
    return NextResponse.json({ error: "Failed to load promo codes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const rawBody = await request.json();

    const body: Record<string, unknown> = {};
    for (const key of Object.keys(rawBody)) {
      if (ALLOWED_PROMO_FIELDS.has(key)) body[key] = rawBody[key];
    }

    const validationError = validatePromoFields(body);
    if (validationError) return NextResponse.json(validationError, { status: 400 });

    if (!body.code) return NextResponse.json({ error: "code is required" }, { status: 400 });
    if (body.discount_value === undefined) return NextResponse.json({ error: "discount_value is required" }, { status: 400 });

    const { admin } = ctx;
    const { data, error } = await admin
      .from("promo_codes")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ promo: data });
  } catch (error: any) {
    console.error("[admin/promos] POST error:", error.message);
    if (error.code === "23505")
      return NextResponse.json({ error: "A promo code with this name already exists." }, { status: 409 });
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, ...rawUpdates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing promo id" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawUpdates)) {
      if (ALLOWED_PROMO_FIELDS.has(key)) updates[key] = rawUpdates[key];
    }
    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    const validationError = validatePromoFields(updates);
    if (validationError) return NextResponse.json(validationError, { status: 400 });

    const { admin } = ctx;
    const { data, error } = await admin
      .from("promo_codes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ promo: data });
  } catch (error: any) {
    console.error("[admin/promos] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing promo id" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("promo_codes").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/promos] DELETE error:", error.message);
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
  }
}
