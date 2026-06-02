import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// GET ?variantId=... — fetch unused codes for a variant
export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get("variantId");
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    // Validate each entry has a non-empty string code
    for (const c of codes) {
      if (!c || typeof c.code !== "string" || c.code.trim().length === 0) {
        return NextResponse.json({ error: "Each code must have a non-empty string value" }, { status: 400 });
      }
    }

    const { admin } = ctx;

    // Check for duplicates
    const { data: existing } = await admin
      .from("product_codes")
      .select("code")
      .in("code", codes.map((c: any) => c.code.trim()));

    if (existing && existing.length > 0) {
      const duplicates = existing.map((c: any) => c.code).join(", ");
      return NextResponse.json(
        { error: `Duplicate codes found: ${duplicates}` },
        { status: 409 },
      );
    }

    const { error } = await admin.from("product_codes").insert(codes);
    if (error) throw error;
    return NextResponse.json({ success: true, count: codes.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      const { error } = await admin.from("product_codes").delete().eq("id", id);
      if (error) throw error;
    } else if (variantId) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
