import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderStatusEmail } from "@/lib/resend";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Auth Check
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();
    if (user?.role !== "admin")
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
      query = query.or(`order_number.ilike.%${search}%`);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    // Logic for completing manual delivery items
    if (updates.status === "completed") {
      await supabase
        .from("order_items")
        .update({ status: "delivered" })
        .eq("order_id", orderId)
        .eq("status", "pending");
    }

    // Send status update email to customer
    if (updates.status && ["completed", "processing", "cancelled"].includes(updates.status)) {
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
        // Don't fail the status update if email fails
        console.error("Failed to send status email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Order updated successfully",
    });
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 },
    );
  }
}
