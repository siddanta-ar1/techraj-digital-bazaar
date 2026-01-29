import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Query to get the check constraint definition
        // Note: This requires permissions to read information_schema, which authenticated users usually have.
        const { data, error } = await supabase
            .rpc('get_check_constraint_def', { constraint_name: 'orders_payment_method_check' });

        // If RPC doesn't exist (likely), try raw query via some other method? 
        // Supabase JS client doesn't support raw SQL directly unless enabled via RPC.

        // Alternative: Try to insert a dummy row with a known BAD value and see the exact error? 
        // But we already have the error.

        // Alternative 2: Try to fetch the constraint definition if we can access `pg_catalog` or `information_schema` via standard select.
        // NOTE: Supabase API (PostgREST) usually exposes tables in 'public' schema, not system schemas.

        // However, we can try to guess by checking valid values from existing orders.
        const { data: existingMethods, error: methodsError } = await supabase
            .from('orders')
            .select('payment_method');

        if (methodsError) throw methodsError;

        const uniqueMethods = [...new Set((existingMethods || []).map(o => o.payment_method))];

        return NextResponse.json({
            uniqueMethods
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
