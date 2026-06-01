import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Map MIME → safe extension server-side; never trust client-supplied filename extension
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

// Magic bytes for accepted image types — first 4 bytes only
const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header; webp check below
];

function validateMagicBytes(buffer: ArrayBuffer, claimedMime: string): boolean {
  const view = new Uint8Array(buffer, 0, 12);
  if (claimedMime === "image/jpeg") return view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff;
  if (claimedMime === "image/png")  return view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4e && view[3] === 0x47;
  if (claimedMime === "image/webp") {
    // RIFF....WEBP
    return view[0] === 0x52 && view[1] === 0x49 && view[2] === 0x46 && view[3] === 0x46 &&
           view[8] === 0x57 && view[9] === 0x45 && view[10] === 0x42 && view[11] === 0x50;
  }
  return false;
}

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
    // Derive extension from MIME type — never trust client-supplied filename
    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    // Validate actual file content via magic bytes — defeats MIME type spoofing
    if (!validateMagicBytes(fileBuffer, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 });
    }

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
