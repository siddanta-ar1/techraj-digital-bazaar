import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

// GET ?groupId=... — fetch a single option group with its options
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (!groupId)
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("option_groups")
      .select("*, options:options(*)")
      .eq("id", groupId)
      .single();

    if (error) throw error;
    return NextResponse.json({ group: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create option group + upsert its options
export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { groupData, options } = await request.json();
    const admin = createAdminClient();

    const { data: group, error: groupError } = await admin
      .from("option_groups")
      .insert([groupData])
      .select()
      .single();

    if (groupError) throw groupError;

    if (options && options.length > 0) {
      const optionRows = options.map((opt: any, i: number) => ({
        ...opt,
        group_id: group.id,
        sort_order: i,
      }));
      const { error: optError } = await admin.from("options").insert(optionRows);
      if (optError) throw optError;
    }

    return NextResponse.json({ groupId: group.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE ?groupId=... — delete option group and all its options
export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (!groupId)
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("option_groups").delete().eq("id", groupId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — update option group + sync options (upsert existing, insert new, delete removed)
export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { groupId, groupData, options, deletedOptionIds } = await request.json();
    if (!groupId)
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });

    const admin = createAdminClient();

    // Update group
    const { error: groupError } = await admin
      .from("option_groups")
      .update({ ...groupData, updated_at: new Date().toISOString() })
      .eq("id", groupId);

    if (groupError) throw groupError;

    // Delete removed options
    if (deletedOptionIds && deletedOptionIds.length > 0) {
      await admin.from("options").delete().in("id", deletedOptionIds);
    }

    // Upsert options
    if (options && options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const optionData = { ...opt, group_id: groupId, sort_order: i };

        if (opt.id) {
          await admin
            .from("options")
            .update({ ...optionData, updated_at: new Date().toISOString() })
            .eq("id", opt.id);
        } else {
          await admin.from("options").insert([optionData]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
