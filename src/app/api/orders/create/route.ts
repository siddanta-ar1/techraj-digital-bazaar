// src/app/api/orders/create/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
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
    } = orderData;

    const orderNumber = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const orderId = crypto.randomUUID();

    // ---------------------------------------------------------
    // WALLET PAYMENT LOGIC
    // ---------------------------------------------------------
    if (paymentMethod === "wallet") {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: "Failed to retrieve wallet balance" },
          { status: 500 },
        );
      }

      const currentBalance = Number(userData.wallet_balance);
      const amountToDeduct = Number(totalAmount);

      if (currentBalance < amountToDeduct) {
        return NextResponse.json(
          { error: "Insufficient wallet balance. Please top up." },
          { status: 400 },
        );
      }

      const newBalance = currentBalance - amountToDeduct;

      // Update User Balance
      const { error: updateError } = await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (updateError) {
        throw new Error("Failed to update wallet balance");
      }

      // Create Transaction Record
      const { error: txnError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          amount: amountToDeduct,
          type: "debit",
          transaction_type: "purchase",
          reference_id: orderId,
          description: `Purchase Order #${orderNumber}`,
          balance_after: newBalance,
          status: "completed",
        });

      if (txnError) console.error("Transaction Log Error:", txnError);
    }
    // ---------------------------------------------------------

    // 2. Create Order
    const { error: orderError } = await supabase.from("orders").insert([
      {
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        total_amount: totalAmount,
        final_amount: totalAmount,
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

    if (orderError) {
      console.error("Supabase Order Error:", orderError);

      // FIX: Correct error handling for RPC - removed .catch chaining
      if (paymentMethod === "wallet") {
        const { error: refundError } = await supabase.rpc("increment_wallet", {
          p_user_id: user.id,
          p_amount: totalAmount,
        });

        if (refundError) {
          console.error("Refund failed:", refundError);
        }
      }
      throw new Error(orderError.message);
    }

    // 3. Insert Order Items
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
      console.error("Order Items Error:", itemsError);
      throw new Error("Failed to create order items");
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
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
