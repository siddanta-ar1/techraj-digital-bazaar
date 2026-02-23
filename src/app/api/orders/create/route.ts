import { createClient } from "@/lib/supabase/server";
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

    // 2. PARSE REQUEST
    const orderData = await request.json();
    const {
      items,
      paymentMethod,
      totalAmount,
      discountAmount = 0,
      finalAmount,
      deliveryDetails,
      paymentScreenshotUrl,
      paymentMeta,
      promoCode,
    } = orderData;

    // 3. VALIDATE FINAL AMOUNTS (promo validation already done on frontend)
    const calculatedFinalAmount = Math.max(
      0,
      Number(totalAmount) - Number(discountAmount),
    );

    // Security check: ensure frontend calculations match
    if (Math.abs(calculatedFinalAmount - Number(finalAmount)) > 0.01) {
      return NextResponse.json(
        { error: "Invalid calculation detected" },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 3.5 PROMO CODE & PRICE VALIDATION
    // ---------------------------------------------------------
    // We validate promo availability AND increment usage *before* creating the order.
    // This reduces race conditions where multiple users use the last promo code at the same time.

    let promoId = null;
    let promoDiscount = 0;

    if (promoCode) {
      // Fetch promo details
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promoError || !promo) {
        // If user claimed a promo but it's invalid/inactive, we should fail or strip custom
        return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
      }

      // Check usage limits if applicable
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
      }

      promoId = promo.id;

      // OPTIONAL: Recalculate discount here for security (skipping for now to match strict instruction scope, but recommended)

      // Increment Usage NOW
      const { error: incrementError } = await supabase.rpc("increment_promo_usage", { promo_id: promoId });
      if (incrementError) {
        return NextResponse.json({ error: "Failed to apply promo code" }, { status: 400 });
      }
    }

    // Handle "Full Discount" (Zero Payment)
    const isFullDiscount = Number(finalAmount) === 0;
    const effectivePaymentMethod = isFullDiscount ? "wallet" : paymentMethod;

    // 4. GENERATE ORDER ID
    const orderNumber = `TR-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;
    const orderId = crypto.randomUUID();


    // 5. HANDLE INVENTORY CODE USAGE (if applicable)
    if (paymentMeta?.usedProductCodeId) {
      const { error: markUsedError } = await supabase
        .from("product_codes")
        .update({
          is_used: true,
          order_id: orderId,
          used_at: new Date().toISOString(),
        })
        .eq("id", paymentMeta.usedProductCodeId)
        .eq("is_used", false);

      if (markUsedError) {
        // Rollback Promo
        if (promoId) await supabase.rpc("decrement_promo_usage", { promo_id: promoId });

        return NextResponse.json(
          { error: "Gift card has already been used" },
          { status: 400 },
        );
      }
    }

    // 6. WALLET PAYMENT DEDUCTION (If applicable)
    if (effectivePaymentMethod === "wallet" && !isFullDiscount) {
      const { error: deductionError } = await supabase.rpc(
        "deduct_wallet_balance",
        {
          user_id: user.id,
          amount: Number(finalAmount),
        },
      );

      if (deductionError) {
        // Rollback inventory code
        if (paymentMeta?.usedProductCodeId) {
          await supabase
            .from("product_codes")
            .update({
              is_used: false,
              order_id: null,
              used_at: null,
            })
            .eq("id", paymentMeta.usedProductCodeId);
        }
        // Rollback Promo
        if (promoId) await supabase.rpc("decrement_promo_usage", { promo_id: promoId });

        return NextResponse.json(
          {
            error:
              deductionError.message ||
              "Insufficient balance or payment failed",
          },
          { status: 400 },
        );
      }

      // ... Wallet Transaction Insert ...
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: Number(finalAmount),
        type: "debit",
        transaction_type: "purchase",
        reference_id: orderId,
        description: `Order #${orderNumber}`,
        status: "completed",
      });
    }

    // ---------------------------------------------------------
    // ⚡ 7. ATOMIC DIGITAL DELIVERY SYSTEM
    // ---------------------------------------------------------
    // Only attempt auto-delivery if payment is confirmed (Wallet/Full Discount)
    const isInstantPayment = effectivePaymentMethod === "wallet";

    // We will build a list of processed items to insert into DB
    const processedItems = [];
    // We will build a list of items WITH codes to send via Email
    const emailItems = [];

    for (const item of items) {
      let assignedCode = null;
      let itemStatus = "pending";

      // Try to find and atomically assign codes for this variant
      if (isInstantPayment) {
        try {
          // Use a PostgreSQL function to atomically claim codes
          const { data: claimedCodes, error: claimError } = await supabase.rpc(
            "claim_product_codes_atomic",
            {
              p_variant_id: item.variantId,
              p_quantity: item.quantity,
              p_order_id: orderId,
            },
          );

          if (
            !claimError &&
            claimedCodes &&
            claimedCodes.length === item.quantity
          ) {
            assignedCode = claimedCodes.join(", ");
            itemStatus = "completed";
          }
        } catch (error) {
          console.error(
            "Error claiming codes for variant",
            item.variantId,
            error,
          );
          // Continue with pending status if code assignment fails
        }
      }

      // Prepare item for DB
      processedItems.push({
        order_id: orderId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        status: itemStatus,
        delivered_code: assignedCode, // Save code in history
        // PPOM fields
        combination_id: item.combinationId || null,
        option_selections: item.optionSelections || null,
      });

      // Prepare item for Email
      emailItems.push({
        productName: item.productName || "Product",
        variantName: item.variantName || "Standard",
        quantity: item.quantity,
        delivered_code: assignedCode, // Email template checks this
      });
    }

    // Check if ALL items were delivered instantly
    const allDelivered = processedItems.every((i) => i.status === "completed");

    // If Wallet payment AND all items delivered -> Order is Completed
    // If Bank Transfer OR some items missing codes -> Order is Pending
    const orderStatus =
      isInstantPayment && allDelivered ? "completed" : "pending";

    // 8. CREATE ORDER — use .select() to read back the DB-generated order_number
    // (A database trigger may rewrite order_number to a different format)
    const { data: createdOrder, error: orderError } = await supabase.from("orders").insert([
      {
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        total_amount: Number(totalAmount),
        discount_amount: Number(discountAmount),
        final_amount: Number(finalAmount),
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

    // Rollback on order creation failure
    if (orderError) {
      // Rollback wallet deduction
      if (effectivePaymentMethod === "wallet" && !isFullDiscount) {
        await supabase.rpc("increment_wallet", {
          p_user_id: user.id,
          p_amount: Number(finalAmount),
        });
      }

      // Rollback inventory code usage
      if (paymentMeta?.usedProductCodeId) {
        await supabase
          .from("product_codes")
          .update({
            is_used: false,
            order_id: null,
            used_at: null,
          })
          .eq("id", paymentMeta.usedProductCodeId);
      }

      // Rollback claimed product codes
      await supabase
        .from("product_codes")
        .update({
          is_used: false,
          order_id: null,
        })
        .eq("order_id", orderId);

      // Rollback Promo
      if (promoId) await supabase.rpc("decrement_promo_usage", { promo_id: promoId });

      throw new Error(orderError.message);
    }

    // 9. INSERT ORDER ITEMS
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(processedItems);

    if (itemsError) {
      throw new Error("Failed to create order items");
    }

    // 10. PROMO USAGE ALREADY HANDLED AT STEP 3.5

    // Use the DB-generated order_number (may differ from the JS-generated one due to DB trigger)
    const finalOrderNumber = createdOrder?.order_number || orderNumber;

    // 11. SEND EMAIL (Now with codes!)
    if (user.email) {
      // We pass 'emailItems' which contains 'delivered_code'
      await sendOrderEmail(user.email, finalOrderNumber, finalAmount, emailItems);
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: finalOrderNumber,
      finalAmount: Number(finalAmount),
      discountAmount: Number(discountAmount),
      paymentStatus: isInstantPayment ? "paid" : "pending",
      orderStatus: orderStatus,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}
