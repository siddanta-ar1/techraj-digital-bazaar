import { notFound } from "next/navigation";
import OrderDetailsClient from "./OrderDetailsClient";
import { createClient } from "@/lib/supabase/server";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*, user:users(*), order_items(*, variant:product_variants(*, product:products(*)))`,
    )
    .eq("id", id)
    .single();

  if (!order) notFound();
  return (
    <div className="container mx-auto py-8 px-4">
      <OrderDetailsClient order={order} />
    </div>
  );
}
