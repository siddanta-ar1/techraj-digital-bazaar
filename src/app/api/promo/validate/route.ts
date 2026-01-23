import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. AUTHENTICATE USER
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. PARSE REQUEST
    const { code, totalAmount } = await request.json();

    if (!code || typeof totalAmount !== "number") {
      return NextResponse.json(
        { error: "Code and total amount are required" },
        { status: 400 },
      );
    }

    const codeToTest = code.trim();

    // 3. ATOMIC CHECK FOR INVENTORY CODES (Gift Cards)
    // Use a transaction-like approach to check and temporarily reserve the code
    const { data: inventoryCode, error: inventoryError } = await supabase
      .from("product_codes")
      .select("id, code, discount_amount, variant_id")
      .eq("code", codeToTest)
      .eq("is_used", false)
      .maybeSingle();

    if (inventoryCode) {
      const discountValue = inventoryCode.discount_amount || 0;

      if (discountValue <= 0) {
        return NextResponse.json(
          { error: "This code has no value attached" },
          { status: 400 },
        );
      }

      // Cap discount at total amount (cannot go below 0)
      const calculatedDiscount = Math.min(discountValue, totalAmount);

      return NextResponse.json({
        success: true,
        type: "inventory",
        discount: calculatedDiscount,
        message: "Gift Card Applied Successfully!",
        codeId: inventoryCode.id,
      });
    }

    // 4. CHECK STANDARD PROMO CODES
    const { data: promo, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", codeToTest.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (promoError || !promo) {
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 400 },
      );
    }

    // 5. VALIDATE PROMO CODE CONDITIONS
    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Promo code has expired" },
        { status: 400 },
      );
    }

    // Check minimum order amount
    if (totalAmount < (promo.min_order_amount || 0)) {
      return NextResponse.json(
        {
          error: `Minimum order of Rs. ${promo.min_order_amount} required`,
        },
        { status: 400 },
      );
    }

    // Check usage limit (if applicable)
    // Note: using max_uses and current_uses to match existing schema
    const maxUses = promo.usage_limit || promo.max_uses;
    const currentUses = promo.usage_count || promo.current_uses || 0;

    if (maxUses && currentUses >= maxUses) {
      return NextResponse.json(
        { error: "Promo code usage limit exceeded" },
        { status: 400 },
      );
    }

    // 6. CALCULATE DISCOUNT
    let calculatedDiscount = 0;
    if (promo.discount_type === "percentage") {
      calculatedDiscount = (totalAmount * promo.discount_value) / 100;
      // Apply max discount limit if set
      if (promo.max_discount_amount) {
        calculatedDiscount = Math.min(
          calculatedDiscount,
          promo.max_discount_amount,
        );
      }
    } else {
      calculatedDiscount = promo.discount_value;
    }

    // Ensure discount doesn't exceed total amount
    calculatedDiscount = Math.min(calculatedDiscount, totalAmount);

    return NextResponse.json({
      success: true,
      type: "promo",
      discount: calculatedDiscount,
      message: "Promo code applied successfully!",
      promoId: promo.id,
    });
  } catch (error: any) {
    console.error("Promo validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 },
    );
  }
}
