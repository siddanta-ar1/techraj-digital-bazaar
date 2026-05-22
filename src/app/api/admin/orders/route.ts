import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderStatusEmail, sendCodesDeliveredEmail } from "@/lib/resend";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Auth Check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.app_metadata?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const payment = searchParams.get("payment");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        user:users(full_name, email, phone)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") query = query.eq("status", status);
    if (payment && payment !== "all")
      query = query.eq("payment_method", payment);

    // Note: Complex OR searches across joined tables require a specific syntax in Supabase
    if (search) {
      const safeSearch = String(search).slice(0, 100);
      query = query.or(`order_number.ilike.%${safeSearch}%`);
    }

    const { data: orders, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      orders,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error("[admin/orders] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // FIX 1: Use getUser() instead of getSession() for security
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.app_metadata?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { orderId, updates } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // FIX 2: Handle potential PGRST116 by checking if order exists before .single()
    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .maybeSingle(); // Use maybeSingle() to avoid crash if 0 rows are returned

    if (updateError) throw updateError;

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or no changes made" },
        { status: 404 },
      );
    }

    // When completing an order, claim digital codes for all pending items
    // and mark payment as paid (for manual payment methods like eSewa/bank)
    if (updates.status === "completed") {
      // Mark payment as paid
      await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", orderId);

      // Fetch pending items that haven't had codes delivered yet
      const { data: pendingItems } = await supabase
        .from("order_items")
        .select("id, variant_id, quantity, delivered_code")
        .eq("order_id", orderId)
        .eq("status", "pending");

      const deliveredItems: {
        productName: string;
        variantName: string;
        quantity: number;
        delivered_code: string | null;
      }[] = [];

      if (pendingItems && pendingItems.length > 0) {
        // Fetch product names for the email
        const variantIds = pendingItems.map((i: any) => i.variant_id);
        const { data: variantData } = await supabase
          .from("product_variants")
          .select("id, variant_name, product:products(name)")
          .in("id", variantIds);

        const variantMap = new Map(
          (variantData ?? []).map((v: any) => [v.id, v]),
        );

        for (const item of pendingItems) {
          let deliveredCode: string | null = null;

          // Try to claim codes atomically
          try {
            const { data: claimedCodes, error: claimError } =
              await supabase.rpc("claim_product_codes_atomic", {
                p_variant_id: item.variant_id,
                p_quantity: item.quantity,
                p_order_id: orderId,
              });

            if (!claimError && claimedCodes && claimedCodes.length > 0) {
              deliveredCode = claimedCodes.join(", ");
            }
          } catch {
            // Non-fatal: item will be marked delivered without a code
          }

          // Update the order item
          await supabase
            .from("order_items")
            .update({
              status: "delivered",
              delivered_code: deliveredCode,
            })
            .eq("id", item.id);

          const variant = variantMap.get(item.variant_id) as any;
          deliveredItems.push({
            productName: variant?.product?.name ?? "Product",
            variantName: variant?.variant_name ?? "Standard",
            quantity: item.quantity,
            delivered_code: deliveredCode,
          });
        }
      }

      // Send codes-delivered email (replaces the generic status email for completions)
      try {
        const { data: customer } = await supabase
          .from("users")
          .select("email")
          .eq("id", order.user_id)
          .single();

        if (customer?.email) {
          await sendCodesDeliveredEmail(
            customer.email,
            order.order_number,
            order.final_amount,
            deliveredItems,
          );
        }
      } catch (emailError) {
        console.error("Failed to send codes email:", emailError);
      }

      return NextResponse.json({ success: true, order, message: "Order completed and codes delivered" });
    }

    // Send status update email for other status changes (processing, cancelled)
    if (updates.status && ["processing", "cancelled"].includes(updates.status)) {
      try {
        const { data: customer } = await supabase
          .from("users")
          .select("email")
          .eq("id", order.user_id)
          .single();

        if (customer?.email) {
          await sendOrderStatusEmail(
            customer.email,
            order.order_number,
            updates.status,
            order.final_amount,
          );
        }
      } catch (emailError) {
        console.error("Failed to send status email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Order updated successfully",
    });
  } catch (error: any) {
    console.error("[admin/orders] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
