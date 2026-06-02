import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const body = await request.json();
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

    const { id, ...updates } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing category id" }, { status: 400 });

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
