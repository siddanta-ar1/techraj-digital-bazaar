import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

// GET /api/admin/wallet/adjust?search=... — search users
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const admin = createAdminClient();

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
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId, type, amount, note } = await request.json();

    if (!userId || !type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["credit", "debit"].includes(type)) {
      return NextResponse.json({ error: "type must be credit or debit" }, { status: 400 });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch current balance
    const { data: userRow, error: fetchError } = await admin
      .from("users")
      .select("id, full_name, email, wallet_balance")
      .eq("id", userId)
      .single();

    if (fetchError || !userRow)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const currentBalance = Number(userRow.wallet_balance) || 0;

    if (type === "debit" && numAmount > currentBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Current balance: Rs. ${currentBalance}` },
        { status: 400 },
      );
    }

    const newBalance =
      type === "credit"
        ? currentBalance + numAmount
        : currentBalance - numAmount;

    // Update wallet balance
    const { error: updateError } = await admin
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txnError } = await admin.from("wallet_transactions").insert([
      {
        user_id: userId,
        amount: numAmount,
        type,
        transaction_type: "admin_adjustment",
        description: note?.trim()
          ? `Admin ${type}: ${note.trim()}`
          : `Admin ${type} adjustment`,
        balance_after: newBalance,
        status: "completed",
      },
    ]);

    if (txnError) throw txnError;

    return NextResponse.json({
      success: true,
      newBalance,
      message: `Rs. ${numAmount.toLocaleString()} ${type === "credit" ? "credited to" : "debited from"} ${userRow.full_name}'s wallet`,
    });
  } catch (error: any) {
    console.error("[admin/wallet/adjust] POST error:", error.message);
    return NextResponse.json({ error: "Failed to adjust wallet balance" }, { status: 500 });
  }
}
