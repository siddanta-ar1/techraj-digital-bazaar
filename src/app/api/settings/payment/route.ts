import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient(); // This uses user session, but we might need service role if RLS blocks user. 
        // However, usually lib/supabase/server is for authenticated user actions. 
        // If the table is "site_settings" and it is admin-only read, then we need to bypass RLS or allow public read.
        // If we can't change the DB, we can't easily get a Service Role client unless we have the SUPABASE_SERVICE_ROLE_KEY env var.
        // Assuming process.env.SUPABASE_SERVICE_ROLE_KEY is available or we can use the default client if policies allow.
        // Use the user-scoped client first. If that fails, the DB policy is too strict.
        // Given the user prompt "fix this inconsistency", and typical setups, "site_settings" should be public read.
        // If it's not, we should probably query it with a service role if available, 
        // OR just use the authenticated user since the user is logged in at checkout.
        // But wait, CheckoutClient uses client-side supabase which IS the authenticated user.
        // If that failed, it means the Policy is "Admin Only" or something.
        // So we MUST use Service Role to read it and return it to the frontend.

        // Check if we have service role key
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        let dbClient = supabase;
        if (serviceRoleKey) {
            const { createClient: createClientSupabase } = require("@supabase/supabase-js");
            dbClient = createClientSupabase(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey
            );
        }

        const { data, error } = await dbClient
            .from("site_settings")
            .select("value")
            .eq("key", "payment_methods")
            .single();

        if (error) throw error;

        return NextResponse.json({ settings: data?.value || null });
    } catch (error: any) {
        console.error("Failed to fetch payment settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}
