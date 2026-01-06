import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy") || "newest";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "1000000");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    // We join variants with !inner to filter the parent product by variant price
    let query = supabase
      .from("products")
      .select(
        `
        *,
        category:categories(*),
        variants:product_variants!inner(*)
      `,
        { count: "exact" },
      )
      .eq("is_active", true)
      .gte("variants.price", minPrice)
      .lte("variants.price", maxPrice);

    if (category && category !== "undefined" && category !== "null") {
      query = query.eq("category_id", category);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    // Apply Sorting (Using created_at as primary sort for now)
    // Note: Sorting by related price requires a schema change (min_price column)
    // for high-performance production use.
    if (sortBy === "price_asc") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const {
      data: products,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      products: products,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
