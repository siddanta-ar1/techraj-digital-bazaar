import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendTopupApprovedEmail } from "@/lib/resend";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    let query = admin
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

    if (status) query = query.eq("status", status);

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
    console.error("[admin/wallet/topup] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch top-up requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { requestId, action, adminNotes } = await request.json();

    if (!["approve", "reject"].includes(action))
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const admin = createAdminClient();

    const { data: topupRequest, error: fetchError } = await admin
      .from("topup_requests")
      .select("*, user:users(email)")
      .eq("id", requestId)
      .single();

    if (fetchError || !topupRequest)
      return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (topupRequest.status !== "pending")
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });

    const newStatus = action === "approve" ? "approved" : "rejected";

    const { error: updateError } = await admin
      .from("topup_requests")
      .update({
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) throw updateError;

    if (action === "approve") {
      // Use the increment_wallet RPC for an atomic UPDATE wallet_balance = wallet_balance + amount.
      // This prevents the read-compute-write race condition where two concurrent approvals
      // both read the same balance and the last write silently overwrites the first.
      // It also eliminates the null-balance bug: if the users row doesn't exist the RPC
      // returns an error rather than silently computing 0 + amount.
      const { data: newBalanceResult, error: balanceError } = await admin.rpc(
        "increment_wallet",
        { p_user_id: topupRequest.user_id, p_amount: Number(topupRequest.amount) },
      );

      if (balanceError) {
        // Rollback: revert topup_requests status to pending so the admin can retry
        await admin
          .from("topup_requests")
          .update({ status: "pending", admin_notes: null, updated_at: new Date().toISOString() })
          .eq("id", requestId);
        throw balanceError;
      }

      // Fetch final balance for the transaction record (RPC returns the new balance)
      const newBalance: number =
        typeof newBalanceResult === "number"
          ? newBalanceResult
          : (await admin.from("users").select("wallet_balance").eq("id", topupRequest.user_id).single())
              .data?.wallet_balance ?? Number(topupRequest.amount);

      // Update the pending transaction if it exists; insert one if it doesn't (older requests)
      const { count } = await admin
        .from("wallet_transactions")
        .select("id", { count: "exact", head: true })
        .eq("reference_id", requestId)
        .eq("transaction_type", "topup");

      if ((count ?? 0) > 0) {
        await admin
          .from("wallet_transactions")
          .update({ status: "completed", balance_after: newBalance })
          .eq("reference_id", requestId)
          .eq("transaction_type", "topup");
      } else {
        await admin.from("wallet_transactions").insert({
          user_id: topupRequest.user_id,
          amount: topupRequest.amount,
          type: "credit",
          transaction_type: "topup",
          reference_id: requestId,
          description: "Top-up approved",
          balance_after: newBalance,
          status: "completed",
        });
      }

      if (topupRequest.user?.email) {
        try {
          await sendTopupApprovedEmail(
            topupRequest.user.email,
            topupRequest.amount,
            newBalance,
          );
        } catch (emailError) {
          console.error("Failed to send topup approval email:", emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Top-up request ${action}d successfully`,
    });
  } catch (error: any) {
    console.error("[admin/wallet/topup] POST error:", error.message);
    return NextResponse.json({ error: "Failed to process top-up request" }, { status: 500 });
  }
}
