import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  // Rate limit: 10 uploads per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`upload:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const admin = createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from("payment-screenshots")
      .upload(filePath, fileBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[upload] storage error:", uploadError.message);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("payment-screenshots").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("[upload] unexpected error:", error.message);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
