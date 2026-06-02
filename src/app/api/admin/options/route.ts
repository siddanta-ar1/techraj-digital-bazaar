import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

// GET ?groupId=... — fetch a single option group with its options
export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

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
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

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
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

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
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

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

    // Delete removed options — group_id guard prevents deleting options from other groups
    if (deletedOptionIds && deletedOptionIds.length > 0) {
      const { error: delErr } = await admin
        .from("options")
        .delete()
        .in("id", deletedOptionIds)
        .eq("group_id", groupId);
      if (delErr) throw delErr;
    }

    // Upsert options — run in parallel, each with its own error check.
    // group_id guard on UPDATE prevents cross-group option hijacking (BOLA):
    // without it, supplying an opt.id from a different group would silently
    // mutate that unrelated row.
    if (options && options.length > 0) {
      const results = await Promise.all(
        options.map(async (opt: any, i: number) => {
          const optionData = {
            group_id: groupId,
            sort_order: i,
            name: opt.name,
            display_value: opt.display_value,
            color_code: opt.color_code,
            image_url: opt.image_url,
            icon: opt.icon,
            price_modifier: opt.price_modifier,
            price_modifier_type: opt.price_modifier_type,
            stock_type: opt.stock_type,
            stock_quantity: opt.stock_quantity,
            is_default: opt.is_default,
            is_active: opt.is_active,
            validation_regex: opt.validation_regex,
          };
          if (opt.id) {
            const { error } = await admin
              .from("options")
              .update({ ...optionData, updated_at: new Date().toISOString() })
              .eq("id", opt.id)
              .eq("group_id", groupId); // ownership guard
            return error;
          } else {
            const { error } = await admin.from("options").insert([optionData]);
            return error;
          }
        }),
      );
      const firstErr = results.find(Boolean);
      if (firstErr) throw firstErr;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
