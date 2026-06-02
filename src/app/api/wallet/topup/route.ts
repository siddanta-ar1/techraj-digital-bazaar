import { createClient, createAdminClient } from "@/lib/supabase/server";
import { after, NextResponse } from "next/server";
import { sendAdminTopupNotificationEmail } from "@/lib/resend";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Only allow screenshot URLs from our own Supabase storage — prevents attacker-controlled links
const SUPABASE_STORAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

function isAllowedScreenshotUrl(url: unknown): boolean {
  if (url == null || url === "") return true; // optional field
  if (typeof url !== "string") return false;
  // Fail-closed: if the env var is missing we cannot validate the hostname,
  // so reject any non-empty URL rather than silently allowing all URLs (SSRF).
  if (!SUPABASE_STORAGE_HOST) return false;
  try {
    const parsed = new URL(url);
    // Require HTTPS — HTTP URLs pass the hostname check but must be rejected
    // to prevent downgrade attacks and mixed-content issues in admin emails.
    return parsed.protocol === "https:" && parsed.hostname === SUPABASE_STORAGE_HOST;
  } catch {
    return false;
  }
}

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

    if (!isAllowedScreenshotUrl(screenshotUrl)) {
      return NextResponse.json({ error: "Invalid screenshot URL" }, { status: 400 });
    }

    // Explicit type check before range comparison: JS coercion allows "1000" (string) to
    // pass `"1000" < 100 → false`, inserting a string into a numeric DB column.
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: "Amount must be between Rs. 100 and Rs. 50,000" },
        { status: 400 },
      );
    }

    const ALLOWED_TOPUP_METHODS = new Set(["esewa", "khalti", "bank_transfer"]);
    if (!paymentMethod || !ALLOWED_TOPUP_METHODS.has(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
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

    if (txnError) {
      // P6: wallet_transactions insert failed — clean up the topup_requests row so the
      // user is not permanently locked out by the pending-check on their next attempt.
      const { error: cleanupError } = await admin
        .from("topup_requests")
        .delete()
        .eq("id", topupRequest.id);
      if (cleanupError) {
        // Cleanup also failed — the orphaned row persists. Log with the request ID so
        // support can manually clear it. Return a distinct message so the client knows
        // to contact support rather than silently retrying into a permanent 400.
        console.error("[wallet/topup] orphaned topup_request cleanup failed:", cleanupError.message, "id:", topupRequest.id);
        return NextResponse.json(
          { error: "Submission failed and could not be fully cleaned up. Please contact support if this persists." },
          { status: 500 },
        );
      }
      throw txnError;
    }

    const { data: userRecord } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // P13: Use after() so the Resend HTTP call completes even after the response is sent.
    // On Vercel's serverless runtime the execution context is frozen post-response, which
    // silently drops unawaited in-flight I/O without after().
    // The arrow function must RETURN the promise (no curly braces) so after() can await it.
    after(() => sendAdminTopupNotificationEmail({
      userEmail: userRecord?.email ?? user.email ?? "",
      userName: userRecord?.full_name ?? "Unknown",
      amount,
      paymentMethod,
      transactionId,
      screenshotUrl: screenshotUrl ?? undefined,
      requestId: topupRequest.id,
    }));

    return NextResponse.json({
      success: true,
      requestId: topupRequest.id,
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

    // Single query returns both data and count — eliminates the extra round-trip
    const { data: topupRequests, count, error } = await adminGet
      .from("topup_requests")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

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
