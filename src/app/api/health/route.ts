import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/health
 *
 * Used by uptime monitors, load balancers, and deployment pipelines to verify
 * the application is alive and the database connection is healthy.
 *
 * Returns 200 with { status: "ok" } when everything is healthy.
 * Returns 503 with { status: "degraded", error } if the DB is unreachable.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    // Lightweight DB ping — fetches zero rows from a small table
    const admin = createAdminClient();
    const { error } = await admin
      .from("site_settings")
      .select("key")
      .limit(1)
      .single();

    // A "no rows" PGRST116 error still means the DB is reachable
    const dbOk = !error || error.code === "PGRST116";

    if (!dbOk) {
      return NextResponse.json(
        { status: "degraded", error: "Database unreachable", latencyMs: Date.now() - started },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { status: "ok", latencyMs: Date.now() - started, timestamp: new Date().toISOString() },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "degraded", error: err?.message ?? "Unknown error", latencyMs: Date.now() - started },
      { status: 503 },
    );
  }
}
