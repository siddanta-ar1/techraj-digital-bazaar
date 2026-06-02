import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

// GET /api/admin/wallet/adjust?search=... — search users
export async function GET(request: Request) {
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const { admin } = ctx;

    let query = admin
      .from("users")
      .select("id, full_name, email, phone, wallet_balance")
      .order("full_name", { ascending: true })
      .limit(20);

    if (search) {
      const safe = search.slice(0, 60);
      query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error("[admin/wallet/adjust] GET error:", error.message);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}

// POST /api/admin/wallet/adjust — credit or debit a user's wallet
export async function POST(request: Request) {
  // Rate limit: 20 admin wallet adjustments per minute per IP — prevents
  // a compromised admin account from rapidly draining/inflating multiple wallets.
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin-adjust:${ip}`, 20, 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
    );
  }
  try {
    const ctx = await requireAdmin();
    if (ctx instanceof NextResponse) return ctx;

    const { userId, type, amount, note } = await request.json();

    if (!userId || !type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Validate userId is a UUID — prevents SQL injection via RPC param
    if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }
    if (!["credit", "debit"].includes(type)) {
      return NextResponse.json({ error: "type must be credit or debit" }, { status: 400 });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: "Amount must be a positive number up to Rs. 1,000,000" }, { status: 400 });
    }
    // Cap note to prevent column overflow
    const sanitisedNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

    const { admin } = ctx;

    // Fetch user info for the response message (not for balance — RPCs handle that atomically)
    const { data: userRow, error: fetchError } = await admin
      .from("users")
      .select("id, full_name, email")
      .eq("id", userId)
      .single();

    if (fetchError || !userRow)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Use atomic RPCs instead of read-then-write to eliminate the TOCTOU race
    // where a concurrent deduction could cause the balance to go negative.
    let newBalance: number;
    if (type === "credit") {
      const { data: result, error: creditError } = await admin.rpc("increment_wallet", {
        p_user_id: userId,
        p_amount: amount,
      });
      if (creditError) throw creditError;
      newBalance = typeof result === "number" ? result : 0;
    } else {
      const { data: result, error: debitError } = await admin.rpc("deduct_wallet_balance", {
        user_id: userId,
        amount,
      });
      if (debitError) {
        // deduct_wallet_balance returns an error when balance is insufficient
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      newBalance = typeof result === "number" ? result : 0;
    }

    // Record the adjustment in the audit ledger
    const { error: txnError } = await admin.from("wallet_transactions").insert([
      {
        user_id: userId,
        amount,
        type,
        transaction_type: "admin_adjustment",
        description: sanitisedNote
          ? `Admin ${type}: ${sanitisedNote}`
          : `Admin ${type} adjustment`,
        balance_after: newBalance,
        status: "completed",
      },
    ]);

    if (txnError) throw txnError;

    return NextResponse.json({
      success: true,
      newBalance,
      message: `Rs. ${amount.toLocaleString()} ${type === "credit" ? "credited to" : "debited from"} ${userRow.full_name}'s wallet`,
    });
  } catch (error: any) {
    console.error("[admin/wallet/adjust] POST error:", error.message);
    return NextResponse.json({ error: "Failed to adjust wallet balance" }, { status: 500 });
  }
}
