import { requireAdmin } from "@/lib/adminAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import { sendTopupApprovedEmail } from "@/lib/resend";

export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20), 200);
    const rawStatus = searchParams.get("status");
    const ALLOWED_STATUS = new Set(["pending", "approved", "rejected"]);
    if (rawStatus && !ALLOWED_STATUS.has(rawStatus)) {
      return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
    }
    const status = rawStatus;
    const offset = (page - 1) * limit;

    const { admin } = ctx;
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
  // Rate limit: 30 topup approvals/rejections per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin-topup-approve:${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
    );
  }
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { requestId, action, adminNotes: rawNotes } = await request.json();

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!requestId || !UUID_RE.test(requestId))
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });

    if (!["approve", "reject"].includes(action))
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    // Cap admin notes to prevent storage abuse
    const adminNotes = typeof rawNotes === "string" ? rawNotes.slice(0, 1000) : undefined;

    const { admin } = ctx;

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

    // P3: Add .eq("status", "pending") as an atomic guard so two concurrent admin
    // approvals cannot both succeed. The second concurrent UPDATE finds 0 rows
    // (the first already flipped it to "approved") and we return 409 before ever
    // calling increment_wallet, preventing the double-credit.
    const { data: updatedRows, error: updateError } = await admin
      .from("topup_requests")
      .update({
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("id");

    if (updateError) throw updateError;
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: "Request already processed" }, { status: 409 });
    }

    if (action === "approve") {
      const { data: newBalanceResult, error: balanceError } = await admin.rpc(
        "increment_wallet",
        { p_user_id: topupRequest.user_id, p_amount: Number(topupRequest.amount) },
      );

      if (balanceError) {
        // Wallet was NOT credited — safe to roll back the status update.
        // Check the error: if this rollback also fails, the row is stuck in
        // "approved" with no wallet credit. Log prominently so ops can recover.
        const { error: rbStatusError } = await admin
          .from("topup_requests")
          .update({ status: "pending", admin_notes: null, updated_at: new Date().toISOString() })
          .eq("id", requestId);
        if (rbStatusError) {
          console.error(
            "[topup approve] MANUAL RECOVERY NEEDED: increment_wallet failed AND status rollback failed.",
            "requestId:", requestId, "userId:", topupRequest.user_id,
            "walletError:", balanceError.message,
            "rollbackError:", rbStatusError.message,
          );
        }
        throw balanceError;
      }

      // P2: Resolve the new balance for the audit record.
      // Try the RPC return value first (avoids an extra round-trip).
      // If the RPC doesn't return a usable number, fall back to a fresh SELECT.
      // NEVER roll back a successful increment_wallet due to a read failure —
      // the credit is already committed; only the balance_after audit field would be imprecise.
      let newBalance: number;
      if (typeof newBalanceResult === "number" && Number.isFinite(newBalanceResult)) {
        newBalance = newBalanceResult;
      } else if (
        Array.isArray(newBalanceResult) &&
        newBalanceResult.length > 0 &&
        Number.isFinite(Number(newBalanceResult[0]))
      ) {
        newBalance = Number(newBalanceResult[0]);
      } else {
        const { data: balanceRow } = await admin
          .from("users")
          .select("wallet_balance")
          .eq("id", topupRequest.user_id)
          .single();
        newBalance = typeof balanceRow?.wallet_balance === "number" ? balanceRow.wallet_balance : 0;
        if (!balanceRow) {
          console.warn(
            "[topup approve] could not resolve post-increment balance for user",
            topupRequest.user_id,
            "— recording balance_after=0",
          );
        }
      }

      // P5 + P11: Replace the old SELECT-count → UPDATE/INSERT pattern (3 round trips,
      // TOCTOU race) with a single UPDATE first. If 0 rows affected the pending record
      // doesn't exist (older request), so INSERT it. Both operations check their error.
      const { data: updatedTxn, error: txnUpdateError } = await admin
        .from("wallet_transactions")
        .update({ status: "completed", balance_after: newBalance })
        .eq("reference_id", requestId)
        .eq("transaction_type", "topup")
        .eq("status", "pending")  // idempotency guard — never overwrite an already-completed record
        .select("id");

      if (txnUpdateError) throw txnUpdateError;

      if (!updatedTxn || updatedTxn.length === 0) {
        const { error: txnInsertError } = await admin.from("wallet_transactions").insert({
          user_id: topupRequest.user_id,
          amount: topupRequest.amount,
          type: "credit",
          transaction_type: "topup",
          reference_id: requestId,
          description: "Top-up approved",
          balance_after: newBalance,
          status: "completed",
        });
        if (txnInsertError) throw txnInsertError;
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
    } else {
      // Rejection: mark the pending wallet_transactions row as "failed" so it
      // doesn't appear as a ghost pending entry in audit queries and dashboards.
      const { error: txnFailError } = await admin
        .from("wallet_transactions")
        .update({ status: "failed" })
        .eq("reference_id", requestId)
        .eq("transaction_type", "topup")
        .eq("status", "pending");
      if (txnFailError) {
        // Don't silently succeed — the topup_requests row is rejected but the
        // wallet_transactions row is stuck as pending forever, creating a ghost
        // entry in the user's ledger. Throw so the caller receives a 500 and
        // can retry rather than assuming the rejection fully completed.
        throw txnFailError;
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
