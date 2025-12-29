import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  // 1. Change the type to Promise
  { params }: { params: Promise<{ slug: string }> },
) {
  // 2. Await the params to get the actual slug
  const { slug } = await params;

  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(*),
        variants:product_variants(*)
      `,
      )
      .eq("slug", slug) // 3. Use the awaited slug variable
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 },
    );
  }
}
