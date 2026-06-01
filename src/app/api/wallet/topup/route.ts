// src/app/api/wallet/topup/route.ts
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  // Rate limit: 3 topup requests per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`topup:${ip}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before submitting another top-up." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
    );
  }

  try {
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { amount, paymentMethod, transactionId, screenshotUrl } =
      await request.json();

    if (!amount || amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: "Amount must be between Rs. 100 and Rs. 50,000" },
        { status: 400 },
      );
    }

    const { data: pendingRequests } = await admin
      .from("topup_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1);

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json(
        { error: "You have a pending top-up request. Please wait for it to be processed." },
        { status: 400 },
      );
    }

    const { data: topupRequest, error } = await admin
      .from("topup_requests")
      .insert([{
        user_id: user.id,
        amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        status: "pending",
      }])
      .select()
      .single();

    if (error) throw error;

    const { error: txnError } = await admin
      .from("wallet_transactions")
      .insert([{
        user_id: user.id,
        amount,
        type: "credit",
        transaction_type: "topup",
        reference_id: topupRequest.id,
        description: `Top-up request via ${paymentMethod}`,
        balance_after: 0,
        status: "pending",
      }]);

    if (txnError) throw txnError;
    // TODO: Send notification to admin

    return NextResponse.json({
      success: true,
      topupRequest,
      message: "Top-up request submitted successfully",
    });
  } catch (error: any) {
    console.error("[wallet/topup] POST error:", error.message);
    return NextResponse.json({ error: "Failed to create top-up request" }, { status: 500 });
  }
}

// GET all top-up requests for user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminGet = createAdminClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const { data: topupRequests, error } = await adminGet
      .from("topup_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await adminGet
      .from("topup_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      topupRequests,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error("[wallet/topup] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch top-up requests" }, { status: 500 });
  }
}
