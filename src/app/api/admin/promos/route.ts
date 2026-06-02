import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

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
      .from("promo_codes")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ promo: data });
  } catch (error: any) {
    if (error.code === "23505")
      return NextResponse.json({ error: "A promo code with this name already exists." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { id, ...updates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing promo id" }, { status: 400 });

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
      return NextResponse.json({ error: "Missing promo id" }, { status: 400 });

    const { admin } = ctx;
    const { error } = await admin.from("promo_codes").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
