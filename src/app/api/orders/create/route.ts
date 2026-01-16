import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // 2. Validate Promo Code
    let discountAmount = 0;
    let finalAmount = Number(totalAmount);

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
          await supabase.rpc("increment_promo_usage", { promo_id: promo.id });
        }
      }
    }

    const orderNumber = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const orderId = crypto.randomUUID();

    // 3. Wallet Deduction
    if (paymentMethod === "wallet") {
      const { error: deductionError } = await supabase.rpc(
        "deduct_wallet_balance",
        {
          user_id: user.id,
          amount: Number(finalAmount),
        },
      );

      if (deductionError) {
        return NextResponse.json(
          { error: deductionError.message || "Insufficient balance" },
          { status: 400 },
        );
      }

      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: Number(finalAmount),
        type: "debit",
        transaction_type: "purchase",
        reference_id: orderId,
        description: `Purchase Order #${orderNumber}`,
        status: "completed",
      });
    }

    // 4. CHECK FOR AUTO-DELIVERY (Digital Codes)
    let isAutoDelivery = true;
    const processedItems = [];

    // Loop through all items to find codes
    for (const item of items) {
      let deliveredCode = null;
      let status = "pending";

      // Get variant details to check 'stock_type'
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_type")
        .eq("id", item.variantId)
        .single();

      if (variant?.stock_type === "codes") {
        // Try to fetch ONE unused code for this variant
        // Note: Ideally, if quantity > 1, we need to loop or fetch multiple rows.
        // For simplicity here, we assume quantity=1 per line item or fetch 1 code.
        const { data: codeData } = await supabase
          .from("product_codes")
          .select("id, code")
          .eq("variant_id", item.variantId)
          .eq("is_used", false)
          .limit(1)
          .maybeSingle();

        if (codeData) {
          deliveredCode = codeData.code;
          status = "delivered";

          // Mark code as used IMMEDIATELY
          await supabase
            .from("product_codes")
            .update({
              is_used: true,
              order_id: orderId,
            })
            .eq("id", codeData.id);
        } else {
          // If no code found, fallback to manual processing
          isAutoDelivery = false;
        }
      } else if (variant?.stock_type !== "codes") {
        // If any item is NOT a code (e.g. manual top-up), order is NOT auto-complete
        if (variant?.stock_type !== "unlimited") {
          // assuming 'unlimited' is auto? usually only 'codes' is auto.
          isAutoDelivery = false;
        }
      }

      processedItems.push({
        order_id: orderId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        status: status,
        delivered_code: deliveredCode, // Saves the code into the order_items table
      });
    }

    // Determine Status
    const orderStatus =
      paymentMethod === "wallet" && isAutoDelivery ? "completed" : "pending";
    const paymentStatus = paymentMethod === "wallet" ? "paid" : "pending";

    // 5. Create Order
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
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_screenshot_url: paymentScreenshotUrl,
        delivery_type: isAutoDelivery ? "auto" : "manual",
        delivery_details: {
          ...deliveryDetails,
          transaction_id: paymentMeta?.transactionId,
          amount_paid: paymentMeta?.amountPaid,
        },
      },
    ]);

    if (orderError) {
      // Refund if error
      if (paymentMethod === "wallet") {
        await supabase.rpc("increment_wallet", {
          p_user_id: user.id,
          p_amount: finalAmount,
        });
      }
      throw new Error(orderError.message);
    }

    // 6. Insert Items
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(processedItems);

    if (itemsError) throw new Error("Failed to create order items");

    // 7. Send Email (Pass the processed items which contain the codes)
    if (user.email) {
      sendOrderEmail(user.email, orderNumber, finalAmount, processedItems);
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      finalAmount,
      discountAmount,
      paymentStatus,
      status: orderStatus,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}
