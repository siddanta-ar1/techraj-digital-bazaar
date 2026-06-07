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
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

const ALLOWED_COMBINATION_INSERT = new Set([
  "product_id", "combination", "base_price", "calculated_price",
  "stock_type", "stock_quantity", "is_available", "is_active",
]);
const ALLOWED_STOCK_TYPES = new Set(["unlimited", "limited"]);

// POST — bulk insert combinations
export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { combinations } = await request.json();
    if (!Array.isArray(combinations) || combinations.length === 0)
      return NextResponse.json({ error: "No combinations provided" }, { status: 400 });
    if (combinations.length > 500)
      return NextResponse.json({ error: "Too many combinations in one request" }, { status: 400 });

    const safe: Record<string, unknown>[] = [];
    for (let idx = 0; idx < combinations.length; idx++) {
      const raw = combinations[idx];
      if (!raw.product_id || typeof raw.combination !== "string")
        return NextResponse.json(
          { error: `Item ${idx}: missing product_id or combination` },
          { status: 400 },
        );
      const cp = Number(raw.calculated_price);
      if (!Number.isFinite(cp) || cp < 0)
        return NextResponse.json(
          { error: `Item ${idx}: calculated_price must be a non-negative number` },
          { status: 400 },
        );
      if (raw.stock_type && !ALLOWED_STOCK_TYPES.has(raw.stock_type))
        return NextResponse.json(
          { error: `Item ${idx}: invalid stock_type` },
          { status: 400 },
        );

      const row: Record<string, unknown> = {};
      for (const key of ALLOWED_COMBINATION_INSERT) {
        if (key in raw) row[key] = raw[key];
      }
      safe.push(row);
    }

    const { admin } = ctx;
    const { error } = await admin.from("option_combinations").insert(safe);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

// Allowlist for PATCH — prevents arbitrary column writes via user-controlled `field` string
const ALLOWED_COMBINATION_FIELDS = new Set(["calculated_price", "is_active", "sort_order"]);

// PATCH — update a single combination field
export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, field, value } = await request.json();
    if (!id || !field)
      return NextResponse.json({ error: "Missing id or field" }, { status: 400 });

    if (!ALLOWED_COMBINATION_FIELDS.has(field))
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });

    // Type-check value based on field
    if (field === "calculated_price") {
      const price = Number(value);
      if (!Number.isFinite(price) || price <= 0)
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const { admin } = ctx;
    const { error } = await admin
      .from("option_combinations")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/combinations] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update combination" }, { status: 500 });
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
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
