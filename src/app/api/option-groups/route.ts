import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

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
