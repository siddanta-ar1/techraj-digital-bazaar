import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET ?variantId=... — fetch unused codes for a variant
export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get("variantId");
    if (!variantId || !UUID_RE.test(variantId))
      return NextResponse.json({ error: "Missing or invalid variantId" }, { status: 400 });

    const { admin } = ctx;
    const { data, error } = await admin
      .from("product_codes")
      .select("*")
      .eq("variant_id", variantId)
      .eq("is_used", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ codes: data });
  } catch (error: any) {
    console.error("[admin/codes] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

// POST — bulk insert codes (with duplicate check)
export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { codes } = await request.json();
    if (!Array.isArray(codes) || codes.length === 0)
      return NextResponse.json({ error: "Missing codes array" }, { status: 400 });
    if (codes.length > 1000)
      return NextResponse.json({ error: "Cannot insert more than 1,000 codes at once" }, { status: 400 });

    // Validate and allowlist each entry — only `code` and `variant_id` are accepted.
    // Other columns (is_used, order_id, discount_amount, etc.) are set by the DB or RPCs.
    const sanitized: { code: string; variant_id: string }[] = [];
    for (const c of codes) {
      if (!c || typeof c.code !== "string" || c.code.trim().length === 0) {
        return NextResponse.json({ error: "Each code must have a non-empty string value" }, { status: 400 });
      }
      if (!c.variant_id || !UUID_RE.test(c.variant_id)) {
        return NextResponse.json({ error: "Each code must have a valid variant_id UUID" }, { status: 400 });
      }
      sanitized.push({ code: c.code.trim(), variant_id: c.variant_id });
    }

    const { admin } = ctx;

    // Check for duplicates
    const { data: existing } = await admin
      .from("product_codes")
      .select("code")
      .in("code", sanitized.map((c) => c.code));

    if (existing && existing.length > 0) {
      const duplicates = existing.map((c: any) => c.code).join(", ");
      return NextResponse.json(
        { error: `Duplicate codes found: ${duplicates}` },
        { status: 409 },
      );
    }

    const { error } = await admin.from("product_codes").insert(sanitized);
    if (error) throw error;
    return NextResponse.json({ success: true, count: sanitized.length });
  } catch (error: any) {
    console.error("[admin/codes] POST error:", error.message);
    return NextResponse.json({ error: "Failed to insert codes" }, { status: 500 });
  }
}

// DELETE ?id=... — delete single code
//        ?variantId=... — delete all unused codes for a variant
export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const variantId = searchParams.get("variantId");

    const { admin } = ctx;

    if (id) {
      if (!UUID_RE.test(id))
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      const { error } = await admin.from("product_codes").delete().eq("id", id);
      if (error) throw error;
    } else if (variantId) {
      if (!UUID_RE.test(variantId))
        return NextResponse.json({ error: "Invalid variantId" }, { status: 400 });
      const { error } = await admin
        .from("product_codes")
        .delete()
        .eq("variant_id", variantId)
        .eq("is_used", false);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Missing id or variantId" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/codes] DELETE error:", error.message);
    return NextResponse.json({ error: "Failed to delete codes" }, { status: 500 });
  }
}
