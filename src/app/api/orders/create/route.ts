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
    // WALLET PAYMENT LOGIC (SECURE)
    // ---------------------------------------------------------
    if (paymentMethod === "wallet") {
      // Call the atomic database function
      const { error: deductionError } = await supabase.rpc(
        "deduct_wallet_balance",
        {
          user_id: user.id,
          amount: Number(totalAmount),
        },
      );

      if (deductionError) {
        console.error("Wallet deduction failed:", deductionError);
        return NextResponse.json(
          {
            error:
              deductionError.message ||
              "Insufficient balance or payment failed",
          },
          { status: 400 }, // Bad Request
        );
      }

      // Log the transaction only AFTER successful deduction
      // (Even if this fails, the money is safe. You could wrap this in a Retry later)
      const { error: txnError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          amount: Number(totalAmount),
          type: "debit",
          transaction_type: "purchase",
          reference_id: orderId,
          description: `Purchase Order #${orderNumber}`,
          balance_after: 0, // Note: We'd need to fetch the new balance to be exact, or adjust the RPC to return it.
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
        status: "pending", // You might want to auto-complete digital orders
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

      // COMPENSATION LOGIC: Refund if order creation fails
      if (paymentMethod === "wallet") {
        await supabase.rpc("increment_wallet", {
          p_user_id: user.id,
          p_amount: totalAmount,
        });
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
      // Note: Ideally, you would trigger a full rollback/refund here too
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
