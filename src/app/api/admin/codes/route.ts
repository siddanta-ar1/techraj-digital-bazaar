import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// GET ?variantId=... — fetch unused codes for a variant
export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get("variantId");
    if (!variantId)
      return NextResponse.json({ error: "Missing variantId" }, { status: 400 });

    const admin = createAdminClient();
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
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const { codes } = await request.json();
    if (!Array.isArray(codes) || codes.length === 0)
      return NextResponse.json({ error: "Missing codes array" }, { status: 400 });

    const admin = createAdminClient();

    // Check for duplicates
    const { data: existing } = await admin
      .from("product_codes")
      .select("code")
      .in("code", codes.map((c: any) => c.code));

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
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const variantId = searchParams.get("variantId");

    const admin = createAdminClient();

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
