import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OrderStatusManager } from "@/components/admin/OrderStatusManager"; // We will create this small component inside the page file for simplicity
import Image from "next/image";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch Order Details
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      user:users(full_name, email, phone),
      order_items(
        *,
        variant:product_variants(variant_name, product:products(name, featured_image))
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-500">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize
             ${
               order.status === "completed"
                 ? "bg-green-100 text-green-700"
                 : order.status === "pending"
                   ? "bg-amber-100 text-amber-700"
                   : "bg-slate-100 text-slate-700"
             }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
              Order Items
            </div>
            <div className="divide-y divide-slate-100">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-100 rounded border relative">
                    {item.variant?.product?.featured_image && (
                      <Image
                        src={item.variant.product.featured_image}
                        fill
                        alt=""
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {item.variant?.product?.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.variant?.variant_name} x {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold">Rs. {item.total_price}</div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
              <span>Total Amount</span>
              <span>Rs. {order.final_amount}</span>
            </div>
          </div>

          {/* Payment Proof */}
          {order.payment_screenshot_url && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Payment Proof</h3>
              <div className="relative h-64 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <Image
                  src={order.payment_screenshot_url}
                  fill
                  alt="Proof"
                  className="object-contain"
                />
              </div>
              <div className="mt-2 text-right">
                <a
                  href={order.payment_screenshot_url}
                  target="_blank"
                  className="text-indigo-600 text-sm hover:underline inline-flex items-center gap-1"
                >
                  View Full Image <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Info */}
        <div className="space-y-6">
          {/* Status Manager */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Manage Order</h3>
            <OrderStatusManager
              orderId={order.id}
              currentStatus={order.status}
            />
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Customer Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <div className="truncate">
                  <p className="font-medium text-slate-900">
                    {order.user?.full_name}
                  </p>
                  <p className="text-slate-500">{order.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900 capitalize">
                    {order.payment_method}
                  </p>
                  <p className="text-slate-500">Payment Method</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
