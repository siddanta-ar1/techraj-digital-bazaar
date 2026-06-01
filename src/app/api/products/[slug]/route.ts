import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `*, category:categories(*), variants:product_variants(*)`
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let optionGroups: any[] = [];
    let combinations: any[] = [];

    if (product.ppom_enabled) {
      const { data: pogData } = await supabase
        .from("product_option_groups")
        .select(`*, option_group:option_groups(*, options:options(*))`)
        .eq("product_id", product.id)
        .order("sort_order");

      optionGroups = (pogData || []).map((pog: any) => ({
        ...pog,
        option_group: pog.option_group
          ? {
              ...pog.option_group,
              options: pog.option_group.options
                ?.filter((o: any) => o.is_active)
                .sort((a: any, b: any) => a.sort_order - b.sort_order),
            }
          : null,
      }));

      const { data: comboData } = await supabase
        .from("option_combinations")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true);

      combinations = comboData || [];
    }

    return NextResponse.json(
      { product, optionGroups, combinations },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error: any) {
    console.error("[products/slug] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
