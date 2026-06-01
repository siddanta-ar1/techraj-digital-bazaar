import { notFound, redirect } from "next/navigation";
import OrderDetailsClient from "./OrderDetailsClient";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      `*, user:users(*), order_items(*, variant:product_variants(*, product:products(*)))`,
    )
    .eq("id", id)
    .eq("user_id", user.id) // ensure users can only view their own orders
    .single();

  if (!order) notFound();

  return (
    <div className="container mx-auto py-8 px-4">
      <OrderDetailsClient order={order} />
    </div>
  );
}
