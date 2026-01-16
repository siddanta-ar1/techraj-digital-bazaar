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
      deliveryDetails,
      paymentScreenshotUrl,
      paymentMeta,
      promoCode,
    } = orderData;

    // 3. PROMO CODE VALIDATION
    let discountAmount = 0;
    let finalAmount = Number(totalAmount);
    let promoId = null;

    if (promoCode) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode)
        .eq("is_active", true)
        .single();

      if (promo) {
        const isValidExpiry =
          !promo.expires_at || new Date(promo.expires_at) > new Date();
        const meetsMinAmount = totalAmount >= (promo.min_order_amount || 0);

        if (isValidExpiry && meetsMinAmount) {
          if (promo.discount_type === "percentage") {
            discountAmount = (totalAmount * promo.discount_value) / 100;
          } else {
            discountAmount = promo.discount_value;
          }
          finalAmount = Math.max(0, totalAmount - discountAmount);
          promoId = promo.id;
        }
      }
    }

    // Handle "Full Discount" (Zero Payment)
    const isFullDiscount = finalAmount === 0;
    const effectivePaymentMethod = isFullDiscount ? "wallet" : paymentMethod;

    // 4. GENERATE ORDER ID
    const orderNumber = `TR-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;
    const orderId = crypto.randomUUID();

    // 5. WALLET PAYMENT DEDUCTION (If applicable)
    if (effectivePaymentMethod === "wallet" && !isFullDiscount) {
      const { error: deductionError } = await supabase.rpc(
        "deduct_wallet_balance",
        {
          user_id: user.id,
          amount: Number(finalAmount),
        },
      );

      if (deductionError) {
        return NextResponse.json(
          {
            error:
              deductionError.message ||
              "Insufficient balance or payment failed",
          },
          { status: 400 },
        );
      }

      // Log wallet transaction
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
    // ⚡ 6. AUTOMATED DIGITAL DELIVERY SYSTEM
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

      // Try to find unused codes for this variant
      if (isInstantPayment) {
        // Fetch strictly the amount needed
        const { data: availableCodes } = await supabase
          .from("product_codes")
          .select("id, code")
          .eq("variant_id", item.variantId)
          .eq("is_used", false)
          .limit(item.quantity);

        // Check if we found enough codes
        if (availableCodes && availableCodes.length === item.quantity) {
          const codeIds = availableCodes.map((c) => c.id);
          const codeValues = availableCodes.map((c) => c.code).join(", ");

          // CLAIM THE CODES (Mark as used)
          const { error: claimError } = await supabase
            .from("product_codes")
            .update({
              is_used: true,
              order_id: orderId,
            })
            .in("id", codeIds);

          if (!claimError) {
            assignedCode = codeValues; // "ABCD-1234, WXYZ-5678"
            itemStatus = "completed"; // Mark this specific item as done
          }
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
      });

      // Prepare item for Email
      emailItems.push({
        productName: item.productName || "Product",
        variantName: item.variantName,
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

    // 7. CREATE ORDER
    const { error: orderError } = await supabase.from("orders").insert([
      {
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
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
    ]);

    // Refund wallet if order creation crashes
    if (orderError) {
      if (effectivePaymentMethod === "wallet" && !isFullDiscount) {
        await supabase.rpc("increment_wallet", {
          p_user_id: user.id,
          p_amount: finalAmount,
        });
      }
      throw new Error(orderError.message);
    }

    // 8. INSERT ORDER ITEMS
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(processedItems);

    if (itemsError) {
      throw new Error("Failed to create order items");
    }

    // 9. UPDATE PROMO USAGE (If used)
    if (promoId) {
      await supabase.rpc("increment_promo_usage", { promo_id: promoId });
    }

    // 10. SEND EMAIL (Now with codes!)
    if (user.email) {
      // We pass 'emailItems' which contains 'delivered_code'
      await sendOrderEmail(user.email, orderNumber, finalAmount, emailItems);
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      finalAmount,
      discountAmount,
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
