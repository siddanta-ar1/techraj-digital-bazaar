import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// GET ?slug=...&excludeId=... — slug uniqueness check
export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId") || "";

    if (!slug)
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const { admin } = ctx;
    let query = admin.from("products").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;

    return NextResponse.json({ exists: (data?.length ?? 0) > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
    const { admin } = ctx;

    const { data, error } = await admin
      .from("products")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/products");
    if (data?.slug) revalidatePath(`/products/${data.slug}`);
    return NextResponse.json({ product: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const ALLOWED_PRODUCT_UPDATES = new Set<string>([
  "name", "slug", "description", "category_id", "featured_image",
  "gallery_images", "is_featured", "is_active", "has_variants",
  "requires_manual_delivery", "delivery_instructions",
  "ppom_enabled", "min_price", "max_price",
]);

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, ...rawUpdates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawUpdates)) {
      if (ALLOWED_PRODUCT_UPDATES.has(key)) updates[key] = rawUpdates[key];
    }
    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    const { admin } = ctx;
    const { data, error } = await admin
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/products");
    if (data?.slug) revalidatePath(`/products/${data.slug}`);
    return NextResponse.json({ product: data });
  } catch (error: any) {
    console.error("[admin/products] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("products").delete().eq("id", id);

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
