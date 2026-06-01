import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RefundClient } from "../../../components/refund/RefundClient";

export const dynamic = "force-dynamic";

export default async function RefundPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirect=/refund");
  }

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select(
      "*, order_items(*, variant:product_variants(variant_name, product:products(name)))",
    )
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  return (
    <RefundClient
      user={{ id: user.id, email: user.email ?? "" }}
      initialOrders={orders || []}
    />
  );
}
