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
      const { data: currentUser } = await admin
        .from("users")
        .select("wallet_balance")
        .eq("id", topupRequest.user_id)
        .single();

      const newBalance = (Number(currentUser?.wallet_balance) || 0) + Number(topupRequest.amount);

      await admin
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", topupRequest.user_id);

      await admin
        .from("wallet_transactions")
        .update({ status: "completed", balance_after: newBalance })
        .eq("reference_id", requestId)
        .eq("transaction_type", "topup");

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
