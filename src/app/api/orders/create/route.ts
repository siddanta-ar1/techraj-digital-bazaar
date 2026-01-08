import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
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

    // Use crypto for unique IDs
    const orderNumber = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const orderId = crypto.randomUUID();

    // Create order with robust error handling
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          user_id: session.user.id,
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
      throw new Error(orderError.message);
    }

    // ... (rest of the item insertion logic remains same as original) ...

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
