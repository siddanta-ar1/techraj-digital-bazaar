import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Cap to MAX_IDS to prevent oversized IN clauses; filter malformed UUIDs
  const ids = (searchParams.get("ids")?.split(",").filter(Boolean) ?? [])
    .filter((id) => UUID_RE.test(id))
    .slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("option_groups")
    .select("id, name")
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch option groups" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
