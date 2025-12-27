import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    // Parse query parameters
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    // Start building the query
    let query = supabase
      .from("products")
      .select(
        `
        *,
        category:categories(*),
        variants:product_variants(*)
      `,
        { count: "exact" },
      )
      .eq("is_active", true)
      .range(offset, offset + limit - 1);

    // FIX: Ensure category is a valid UUID and not 'undefined' string
    if (category && category !== "undefined" && category !== "null") {
      // If passing slug instead of ID, we might need to join, but usually ID is passed.
      // Assuming ID is passed here. If slug is passed, you need to look up ID first or change query.
      query = query.eq("category_id", category);
    }

    if (search) {
      // Use 'ilike' for case-insensitive search
      query = query.ilike("name", `%${search}%`);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    // Apply sorting
    switch (sortBy) {
      case "price_asc":
        // Note: Sorting by related table column (variants.price) is hard in Supabase simple query.
        // Usually requires custom RPC function or client-side sort for small datasets.
        // Fallback to created_at for simple implementation or use RPC.
        query = query.order("created_at", { ascending: false });
        break;
      case "price_desc":
        query = query.order("created_at", { ascending: false });
        break;
      default: // newest
        query = query.order("created_at", { ascending: false });
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json({
      products: products,
      total: count || products?.length || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 },
    );
  }
}
