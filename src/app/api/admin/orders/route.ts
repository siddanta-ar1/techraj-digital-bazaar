import { createClient, createAdminClient } from "@/lib/supabase/server";
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

    const admin = createAdminClient();
    let query = admin
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
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (authUser.app_metadata?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { orderId, updates } = await request.json();
    if (!orderId)
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });

    const admin = createAdminClient();

    const { data: order, error: updateError } = await admin
      .from("orders")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!order)
      return NextResponse.json({ error: "Order not found or no changes made" }, { status: 404 });

    if (updates.status === "completed") {
      await admin.from("orders").update({ payment_status: "paid" }).eq("id", orderId);

      const { data: pendingItems } = await admin
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
        const variantIds = pendingItems.map((i: any) => i.variant_id);
        const { data: variantData } = await admin
          .from("product_variants")
          .select("id, variant_name, product:products(name)")
          .in("id", variantIds);

        const variantMap = new Map((variantData ?? []).map((v: any) => [v.id, v]));

        for (const item of pendingItems) {
          let deliveredCode: string | null = null;

          try {
            const { data: claimedCodes, error: claimError } = await admin.rpc(
              "claim_product_codes_atomic",
              { p_variant_id: item.variant_id, p_quantity: item.quantity, p_order_id: orderId },
            );
            if (!claimError && claimedCodes && claimedCodes.length > 0)
              deliveredCode = claimedCodes.join(", ");
          } catch {
            // Non-fatal: item will be marked delivered without a code
          }

          await admin
            .from("order_items")
            .update({ status: "delivered", delivered_code: deliveredCode })
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

      try {
        const { data: customer } = await admin
          .from("users").select("email").eq("id", order.user_id).single();
        if (customer?.email)
          await sendCodesDeliveredEmail(customer.email, order.order_number, order.final_amount, deliveredItems);
      } catch (emailError) {
        console.error("Failed to send codes email:", emailError);
      }

      return NextResponse.json({ success: true, order, message: "Order completed and codes delivered" });
    }

    if (updates.status && ["processing", "cancelled"].includes(updates.status)) {
      try {
        const { data: customer } = await admin
          .from("users").select("email").eq("id", order.user_id).single();
        if (customer?.email)
          await sendOrderStatusEmail(customer.email, order.order_number, updates.status, order.final_amount);
      } catch (emailError) {
        console.error("Failed to send status email:", emailError);
      }
    }

    return NextResponse.json({ success: true, order, message: "Order updated successfully" });
  } catch (error: any) {
    console.error("[admin/orders] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Auth check uses user JWT — then actual deletes use service-role client
    // to bypass RLS (which would otherwise block cross-user deletes)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.app_metadata?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = createAdminClient();

    // Delete order items first (foreign key), then orders
    const { error: itemsError } = await admin
      .from("order_items")
      .delete()
      .gte("created_at", "2000-01-01"); // matches every row; avoids "no filter" rejection

    if (itemsError) throw itemsError;

    const { error: ordersError } = await admin
      .from("orders")
      .delete()
      .gte("created_at", "2000-01-01");

    if (ordersError) throw ordersError;

    return NextResponse.json({ success: true, message: "All orders cleared" });
  } catch (error: any) {
    console.error("[admin/orders] DELETE error:", error.message);
    return NextResponse.json({ error: "Failed to clear orders" }, { status: 500 });
  }
}
