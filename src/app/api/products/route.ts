import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_SORT = new Set(["newest", "oldest", "price_asc", "price_desc"]);
const MAX_LIMIT = 100;
const MAX_SEARCH_LEN = 200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createAdminClient();

    const category = searchParams.get("category");

    // Sanitize search: cap length, strip leading/trailing whitespace
    const rawSearch = searchParams.get("search")?.trim().slice(0, MAX_SEARCH_LEN);
    const search = rawSearch && rawSearch.length >= 1 ? rawSearch : null;

    const featured  = searchParams.get("featured");
    // Allowlist sort values — reject arbitrary column names that could cause unexpected behaviour
    const sortBy    = ALLOWED_SORT.has(searchParams.get("sortBy") ?? "") ? searchParams.get("sortBy")! : "newest";

    // Guard NaN: parseFloat("abc") === NaN — fallback to safe defaults
    const rawMin   = parseFloat(searchParams.get("minPrice") ?? "");
    const rawMax   = parseFloat(searchParams.get("maxPrice") ?? "");
    const minPrice = Number.isFinite(rawMin) && rawMin >= 0 ? rawMin : 0;
    const maxPrice = Number.isFinite(rawMax) && rawMax > 0  ? rawMax : 1_000_000;

    const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    // Cap limit at MAX_LIMIT — prevents ?limit=999999 dumping the entire catalog
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12), MAX_LIMIT);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select(
        `*, category:categories(*), variants:product_variants!inner(*)`,
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

    query = query.order("created_at", { ascending: sortBy === "oldest" || sortBy === "price_asc" });

    const { data: products, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    return NextResponse.json(
      { products, total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error: any) {
    console.error("[products] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
