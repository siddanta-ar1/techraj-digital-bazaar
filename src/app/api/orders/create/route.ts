import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/resend";

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

    // Admin client for tables protected by RLS (product_codes, promo_codes)
    const admin = createAdminClient();

    // 2. PARSE REQUEST — amounts are NOT accepted from the client; computed server-side below
    const orderData = await request.json();
    const {
      items,
      paymentMethod,
      deliveryDetails,
      paymentScreenshotUrl,
      paymentMeta,
      promoCode,
    } = orderData;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain items" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    // 3. FETCH AUTHORITATIVE PRICES FROM DB (never trust client-supplied price)
    const variantIds: string[] = [...new Set(
      items.map((i: any) => i.variantId).filter(Boolean),
    )];
    const combinationIds: string[] = [...new Set(
      items.map((i: any) => i.combinationId).filter(Boolean),
    )];

    const [variantResult, combinationResult] = await Promise.all([
      variantIds.length > 0
        ? supabase
            .from("product_variants")
            .select("id, price, is_active, product_id")
            .in("id", variantIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      combinationIds.length > 0
        ? supabase
            .from("option_combinations")
            .select("id, calculated_price, is_active, product_id")
            .in("id", combinationIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    if (variantResult.error) {
      return NextResponse.json({ error: "Failed to verify product prices" }, { status: 500 });
    }

    const variantPriceMap = new Map(
      (variantResult.data ?? []).map((v) => [v.id, v]),
    );
    const combinationPriceMap = new Map(
      (combinationResult.data ?? []).map((c) => [c.id, c]),
    );

    // Resolve server-authoritative unit price for each item
    type ResolvedItem = {
      variantId: string;
      combinationId: string | null;
      quantity: number;
      unitPrice: number;
      productName: string;
      variantName: string;
      optionSelections: Record<string, string | string[]> | null;
    };

    const MAX_OPTION_SELECTIONS_BYTES = 2048;

    const resolvedItems: ResolvedItem[] = [];
    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { error: "Invalid item: missing variantId or quantity" },
          { status: 400 },
        );
      }

      const variant = variantPriceMap.get(item.variantId);
      if (!variant || !variant.is_active) {
        return NextResponse.json(
          { error: "One or more products are unavailable" },
          { status: 400 },
        );
      }

      let combination = null;
      if (item.combinationId) {
        combination = combinationPriceMap.get(item.combinationId);
        if (!combination) {
          return NextResponse.json(
            { error: "Invalid product configuration" },
            { status: 400 },
          );
        }
        // Verify the combination belongs to the same product as the variant.
        // Without this, a user could pass a cheap combination from a different product.
        if (combination.product_id !== variant.product_id) {
          return NextResponse.json(
            { error: "Invalid product configuration" },
            { status: 400 },
          );
        }
      }

      // Validate optionSelections: must be a plain object, capped at 2 KB
      let safeOptionSelections: Record<string, string | string[]> | null = null;
      if (item.optionSelections != null) {
        if (
          typeof item.optionSelections !== "object" ||
          Array.isArray(item.optionSelections)
        ) {
          return NextResponse.json({ error: "Invalid option selections" }, { status: 400 });
        }
        const serialized = JSON.stringify(item.optionSelections);
        if (serialized.length > MAX_OPTION_SELECTIONS_BYTES) {
          return NextResponse.json({ error: "Option selections too large" }, { status: 400 });
        }
        safeOptionSelections = item.optionSelections as Record<string, string | string[]>;
      }

      // combination price takes precedence; falls back to variant base price
      const unitPrice = combination?.calculated_price ?? variant.price;

      resolvedItems.push({
        variantId: item.variantId,
        combinationId: item.combinationId || null,
        quantity: item.quantity,
        unitPrice,
        productName: typeof item.productName === "string" ? item.productName.slice(0, 200) : "Product",
        variantName: typeof item.variantName === "string" ? item.variantName.slice(0, 200) : "Standard",
        optionSelections: safeOptionSelections,
      });
    }

    // Compute server-side total
    const serverTotalAmount = resolvedItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );

    // ---------------------------------------------------------
    // 4. PROMO CODE — validate AND recompute discount server-side
    // ---------------------------------------------------------
    let promoId: string | null = null;
    let serverDiscountAmount = 0;

    if (promoCode) {
      const { data: promo, error: promoError } = await admin
        .from("promo_codes")
        .select(
          "id, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_count, expires_at, is_active",
        )
        .eq("code", (promoCode as string).toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promoError || !promo) {
        return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
      }
      if (serverTotalAmount < (promo.min_order_amount || 0)) {
        return NextResponse.json(
          { error: `Minimum order of Rs. ${promo.min_order_amount} required` },
          { status: 400 },
        );
      }
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
      }

      // Recompute discount server-side — never trust client value
      if (promo.discount_type === "percentage") {
        serverDiscountAmount = (serverTotalAmount * promo.discount_value) / 100;
        if (promo.max_discount_amount) {
          serverDiscountAmount = Math.min(serverDiscountAmount, promo.max_discount_amount);
        }
      } else {
        serverDiscountAmount = promo.discount_value;
      }
      serverDiscountAmount = Math.min(serverDiscountAmount, serverTotalAmount);

      promoId = promo.id;

      // Increment usage before order creation to reduce race conditions
      const { error: incrementError } = await admin.rpc("increment_promo_usage", {
        promo_id: promoId,
      });
      if (incrementError) {
        return NextResponse.json({ error: "Failed to apply promo code" }, { status: 400 });
      }
    }

    const serverFinalAmount = Math.max(0, serverTotalAmount - serverDiscountAmount);

    // 5. DERIVE PAYMENT STATE
    const isFullDiscount = serverFinalAmount === 0;
    const effectivePaymentMethod = isFullDiscount ? "wallet" : paymentMethod;

    // 6. GENERATE ORDER ID
    const orderNumber = `TR-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const orderId = crypto.randomUUID();

    // 7. HANDLE INVENTORY CODE USAGE (gift card applied as payment)
    if (paymentMeta?.usedProductCodeId) {
      const { error: markUsedError } = await admin
        .from("product_codes")
        .update({
          is_used: true,
          order_id: orderId,
          used_at: new Date().toISOString(),
        })
        .eq("id", paymentMeta.usedProductCodeId)
        .eq("is_used", false);

      if (markUsedError) {
        if (promoId) {
          const { error: rbPromo } = await admin.rpc("decrement_promo_usage", { promo_id: promoId });
          if (rbPromo) console.error("[rollback] decrement_promo_usage failed:", rbPromo.message);
        }
        return NextResponse.json({ error: "Gift card has already been used" }, { status: 400 });
      }
    }

    // 8. WALLET PAYMENT DEDUCTION
    if (effectivePaymentMethod === "wallet" && !isFullDiscount) {
      const { data: balanceAfterDeduction, error: deductionError } = await admin.rpc("deduct_wallet_balance", {
        user_id: user.id,
        amount: serverFinalAmount,
      });

      if (deductionError) {
        if (paymentMeta?.usedProductCodeId) {
          const { error: rbGift } = await admin
            .from("product_codes")
            .update({ is_used: false, order_id: null, used_at: null })
            .eq("id", paymentMeta.usedProductCodeId);
          if (rbGift) console.error("[rollback] gift card unmark failed:", rbGift.message);
        }
        if (promoId) {
          const { error: rbPromo } = await admin.rpc("decrement_promo_usage", { promo_id: promoId });
          if (rbPromo) console.error("[rollback] decrement_promo_usage failed:", rbPromo.message);
        }
        return NextResponse.json(
          { error: "Insufficient balance or payment failed" },
          { status: 400 },
        );
      }

      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: serverFinalAmount,
        type: "debit",
        transaction_type: "purchase",
        reference_id: orderId,
        description: `Order #${orderNumber}`,
        status: "completed",
        balance_after: balanceAfterDeduction ?? 0,
      });
    }

    // ---------------------------------------------------------
    // 9. ATOMIC DIGITAL DELIVERY
    // ---------------------------------------------------------
    const isInstantPayment = effectivePaymentMethod === "wallet";
    const processedItems: any[] = [];
    const emailItems: any[] = [];

    for (const item of resolvedItems) {
      let assignedCode: string | null = null;
      let itemStatus = "pending";

      if (isInstantPayment) {
        try {
          const { data: claimedCodes, error: claimError } = await admin.rpc(
            "claim_product_codes_atomic",
            {
              p_variant_id: item.variantId,
              p_quantity: item.quantity,
              p_order_id: orderId,
            },
          );
          if (!claimError && claimedCodes && claimedCodes.length === item.quantity) {
            assignedCode = claimedCodes.join(", ");
            itemStatus = "completed";
          }
        } catch {
          // Non-fatal: order proceeds with pending delivery
        }
      }

      processedItems.push({
        order_id: orderId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        status: itemStatus,
        delivered_code: assignedCode,
        combination_id: item.combinationId,
        option_selections: item.optionSelections,
      });

      emailItems.push({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        delivered_code: assignedCode,
        optionSelections: item.optionSelections,
      });
    }

    const allDelivered = processedItems.every((i) => i.status === "completed");
    const orderStatus = isInstantPayment && allDelivered ? "completed" : "pending";

    // 10. CREATE ORDER
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          id: orderId,
          order_number: orderNumber,
          user_id: user.id,
          total_amount: serverTotalAmount,
          discount_amount: serverDiscountAmount,
          final_amount: serverFinalAmount,
          promo_code: promoCode || null,
          status: orderStatus,
          payment_method: effectivePaymentMethod,
          payment_status: isInstantPayment ? "paid" : "pending",
          payment_screenshot_url: paymentScreenshotUrl,
          delivery_details: {
            ...deliveryDetails,
            transaction_id: paymentMeta?.transactionId,
            amount_paid: paymentMeta?.amountPaid,
          },
        },
      ])
      .select("order_number")
      .single();

    if (orderError) {
      console.error("[order] insert failed:", orderError.message, "orderId:", orderId);
      // Rollback wallet
      if (effectivePaymentMethod === "wallet" && !isFullDiscount) {
        const { error: rbWallet } = await admin.rpc("increment_wallet", {
          p_user_id: user.id,
          p_amount: serverFinalAmount,
        });
        if (rbWallet) console.error("[rollback] increment_wallet failed — MANUAL RECOVERY NEEDED orderId:", orderId, rbWallet.message);
      }
      // Rollback gift card
      if (paymentMeta?.usedProductCodeId) {
        const { error: rbGift } = await admin
          .from("product_codes")
          .update({ is_used: false, order_id: null, used_at: null })
          .eq("id", paymentMeta.usedProductCodeId);
        if (rbGift) console.error("[rollback] gift card unmark failed:", rbGift.message);
      }
      // Rollback claimed codes
      const { error: rbCodes } = await admin
        .from("product_codes")
        .update({ is_used: false, order_id: null })
        .eq("order_id", orderId);
      if (rbCodes) console.error("[rollback] product_codes unmark failed:", rbCodes.message);
      // Rollback promo
      if (promoId) {
        const { error: rbPromo } = await admin.rpc("decrement_promo_usage", { promo_id: promoId });
        if (rbPromo) console.error("[rollback] decrement_promo_usage failed:", rbPromo.message);
      }
      throw new Error("Failed to create order");
    }

    // 11. INSERT ORDER ITEMS
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(processedItems);

    if (itemsError) {
      throw new Error("Failed to create order items");
    }

    const finalOrderNumber = createdOrder?.order_number || orderNumber;

    // 12. SEND EMAIL
    if (user.email) {
      await sendOrderEmail(user.email, finalOrderNumber, serverFinalAmount, emailItems);
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: finalOrderNumber,
      finalAmount: serverFinalAmount,
      discountAmount: serverDiscountAmount,
      paymentStatus: isInstantPayment ? "paid" : "pending",
      orderStatus,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
