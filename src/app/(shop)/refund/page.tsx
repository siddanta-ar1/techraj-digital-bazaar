import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RefundClient } from "../../../components/refund/RefundClient";

// Force dynamic rendering for auth checks
export const dynamic = "force-dynamic";

export default async function RefundPage() {
  const supabase = await createClient();

  // Server-side auth check - instant redirect for unauthenticated users
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?redirect=/refund");
  }

  // Fetch user orders on server-side for better performance
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "*, order_items(*, variant:product_variants(variant_name, product:products(name)))",
    )
    .eq("user_id", session.user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  // If we reach here, user is authenticated
  // Pass the session and orders to client component
  return (
    <RefundClient
      user={{
        id: session.user.id,
        email: session.user.email || "",
      }}
      initialOrders={orders || []}
    />
  );
}
