import { createAdminClient } from "@/lib/supabase/server";
import PromoClient from "./PromoClient";

export const dynamic = "force-dynamic";

export default async function PromoCodesPage() {
  const admin = createAdminClient();

  const { data: promos } = await admin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return <PromoClient initialData={promos || []} />;
}
