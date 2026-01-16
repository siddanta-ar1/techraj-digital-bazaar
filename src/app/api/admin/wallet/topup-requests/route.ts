import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
// Import the new email utility function (make sure this is implemented in src/lib/resend.ts)
import { sendTopupApprovedEmail } from "@/lib/resend";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("topup_requests")
      .select(
        `
        *,
        user:users(full_name, email, phone)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: requests, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      requests,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch top-up requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { requestId, action, adminNotes } = await request.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the top-up request
    const { data: topupRequest } = await supabase
      .from("topup_requests")
      .select("*, user:users(email)") // Fetch user email too
      .eq("id", requestId)
      .single();

    if (topupRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 },
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update top-up request
    const { error: updateError } = await supabase
      .from("topup_requests")
      .update({
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) throw updateError;

    // If approved, update user wallet balance
    if (action === "approve") {
      // Get current user balance
      const { data: currentUser } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", topupRequest.user_id)
        .single();

      const newBalance =
        (currentUser?.wallet_balance || 0) + topupRequest.amount;

      // Update user balance
      await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", topupRequest.user_id);

      // Update wallet transaction
      await supabase
        .from("wallet_transactions")
        .update({
          status: "completed",
          balance_after: newBalance,
        })
        .eq("reference_id", requestId)
        .eq("transaction_type", "topup");

      // Create completed transaction
      await supabase.from("wallet_transactions").insert([
        {
          user_id: topupRequest.user_id,
          amount: topupRequest.amount,
          type: "credit",
          transaction_type: "topup",
          reference_id: requestId,
          description: `Top-up approved via ${topupRequest.payment_method}`,
          balance_after: newBalance,
          status: "completed",
        },
      ]);

      // SEND EMAIL TO USER
      if (topupRequest.user?.email) {
        await sendTopupApprovedEmail(
          topupRequest.user.email,
          topupRequest.amount,
          newBalance,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Top-up request ${action}d successfully`,
    });
  } catch (error: any) {
    console.error("Top-up action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process top-up request" },
      { status: 500 },
    );
  }
}
