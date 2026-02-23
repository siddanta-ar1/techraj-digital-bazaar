import { createClient } from "@/lib/supabase/server";
import PromoClient from "./PromoClient";

export const dynamic = "force-dynamic";

export default async function PromoCodesPage() {
  const supabase = await createClient();

  const { data: promos } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return <PromoClient initialData={promos || []} />;
}
