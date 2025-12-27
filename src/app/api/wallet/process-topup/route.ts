import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (dbUser?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { requestId, action, notes } = body; // action: 'approve' | 'reject'

    // 1. Get the request
    const { data: topup, error: fetchError } = await supabase
      .from("topup_requests")
      .select("*, user:users(id, wallet_balance, email)")
      .eq("id", requestId)
      .single();

    if (fetchError || !topup) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (topup.status !== "pending") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const amount = Number(topup.amount);
      const currentBalance = Number(topup.user.wallet_balance || 0);
      const newBalance = currentBalance + amount;

      // A. Update User Balance
      const { error: balanceError } = await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", topup.user_id);

      if (balanceError) throw balanceError;

      // B. Create Transaction Record
      await supabase.from("wallet_transactions").insert({
        user_id: topup.user_id,
        amount: amount,
        type: "credit",
        transaction_type: "topup",
        description: `Top-up Approved (Ref: ${topup.transaction_id})`,
        reference_id: topup.id,
        balance_after: newBalance,
        status: "completed",
      });

      // C. Update Request Status
      await supabase
        .from("topup_requests")
        .update({
          status: "approved",
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);
    } else {
      // Reject Flow
      await supabase
        .from("topup_requests")
        .update({
          status: "rejected",
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Topup processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
