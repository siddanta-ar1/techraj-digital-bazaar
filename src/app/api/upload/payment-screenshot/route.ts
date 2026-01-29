import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const path = formData.get("path") as string; // Expecting 'payment-screenshots/filename' or just filename

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Use Service Role to bypass RLS for uploads
        // This is critical because the "new row violates row-level security policy" indicates the user cannot upload directly.

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            // Fallback to auth-user client, but this is likely what failed on frontend.
            // We will try anyway, but log warning.
            console.warn("SUPABASE_SERVICE_ROLE_KEY not found, using user session client");
        }

        let supabase;
        if (serviceRoleKey) {
            const { createClient: createClientSupabase } = require("@supabase/supabase-js");
            supabase = createClientSupabase(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey
            );
        } else {
            supabase = await createClient();
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        // We upload to "payment-screenshots" bucket.
        // The path argument from frontend is not trusted blindly, we construct a safe path.
        // But we can let the frontend verify the bucket? Best to hardcode bucket here.
        const bucket = "payment-screenshots";
        const filePath = fileName;

        const fileBuffer = await file.arrayBuffer();

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
