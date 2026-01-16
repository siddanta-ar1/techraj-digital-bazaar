import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. AUTHENTICATE USER
    // ---------------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 2. PARSE REQUEST
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 3. PROMO CODE VALIDATION
    // ---------------------------------------------------------
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

          // Increment promo usage atomically
          await supabase.rpc("increment_promo_usage", {
            promo_id: promo.id,
          });
        }
      }
    }

    // ---------------------------------------------------------
    // 4. ORDER IDENTIFIERS
    // ---------------------------------------------------------
    const orderNumber = `TR-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    const orderId = crypto.randomUUID();

    // ---------------------------------------------------------
    // 5. WALLET PAYMENT (ATOMIC & SECURE)
    // ---------------------------------------------------------
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
          {
            error:
              deductionError.message ||
              "Insufficient balance or payment failed",
          },
          { status: 400 },
        );
      }

      // Log wallet transaction
      const { error: txnError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          amount: Number(finalAmount),
          type: "debit",
          transaction_type: "purchase",
          reference_id: orderId,
          description: `Purchase Order #${orderNumber}`,
          status: "completed",
        });

      if (txnError) {
        console.error("Wallet Transaction Log Error:", txnError);
      }
    }

    // ---------------------------------------------------------
    // 6. CREATE ORDER
    // ---------------------------------------------------------
    const { error: orderError } = await supabase.from("orders").insert([
      {
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        promo_code: promoCode || null,
        status: "pending",
        payment_method: paymentMethod,
        payment_status: paymentMethod === "wallet" ? "paid" : "pending",
        payment_screenshot_url: paymentScreenshotUrl,
        delivery_details: {
          ...deliveryDetails,
          transaction_id: paymentMeta?.transactionId,
          amount_paid: paymentMeta?.amountPaid,
        },
      },
    ]);

    // ---- COMPENSATION LOGIC ----
    if (orderError) {
      if (paymentMethod === "wallet") {
        await supabase.rpc("increment_wallet", {
          p_user_id: user.id,
          p_amount: finalAmount,
        });
      }
      throw new Error(orderError.message);
    }

    // ---------------------------------------------------------
    // 7. INSERT ORDER ITEMS
    // ---------------------------------------------------------
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      status: "pending",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      throw new Error("Failed to create order items");
    }

    // ---------------------------------------------------------
    // 8. SEND EMAIL (NON-BLOCKING)
    // ---------------------------------------------------------
    if (user.email) {
      sendOrderEmail(user.email, orderNumber, finalAmount);
    }

    // ---------------------------------------------------------
    // 9. RESPONSE
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      finalAmount,
      discountAmount,
      paymentStatus: paymentMethod === "wallet" ? "paid" : "pending",
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}
