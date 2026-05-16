import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    // Auth check — must be logged in to upload
    const supabaseUser = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF are allowed" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("[upload] SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json({ error: "Upload service unavailable" }, { status: 500 });
    }

    const supabase = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
    );

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(filePath, fileBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[upload] storage error:", uploadError.message);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("[upload] unexpected error:", error.message);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
