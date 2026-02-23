import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OrderStatusManager } from "@/components/admin/OrderStatusManager";
import Image from "next/image";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,
  CreditCard,
  Package,
  Mail,
  Phone,
  MapPin,
  Info,
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">
                  Order #{order.order_number || `LEGACY-${order.id.slice(0, 8).toUpperCase()}`}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                  ${order.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.created_at).toLocaleString()}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  {order.payment_method?.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-3xl font-bold text-slate-900">
                Rs. {order.final_amount}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Order Items */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Order Items</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {order.order_items.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="h-20 w-20 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden flex-shrink-0">
                      {item.variant?.product?.featured_image ? (
                        <Image
                          src={item.variant.product.featured_image}
                          fill
                          alt={item.variant.product.name}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-lg mb-1">
                        {item.variant?.product?.name}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {item.variant?.variant_name}
                        </span>
                        <span>x {item.quantity}</span>
                      </div>
                      {/* PPOM Option Selections */}
                      {item.option_selections && Object.keys(item.option_selections).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(item.option_selections).map(([key, value]: [string, any]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                            >
                              <span className="text-purple-500">{key}:</span>{" "}
                              {Array.isArray(value) ? value.join(", ") : String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-lg">
                        Rs. {item.total_price}
                      </p>
                      <p className="text-sm text-slate-500">
                        Rs. {item.unit_price} / unit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <span className="font-medium text-slate-600">Total Items</span>
                <span className="font-bold text-slate-900 text-lg">
                  {order.order_items.reduce(
                    (sum: number, item: any) => sum + item.quantity,
                    0,
                  )}
                </span>
              </div>
            </div>

            {/* Payment Proof */}
            {order.payment_screenshot_url && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800">
                    Payment Proof
                  </h3>
                </div>
                <div className="p-6">
                  <div className="relative h-80 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                    <Image
                      src={order.payment_screenshot_url}
                      fill
                      alt="Payment Proof"
                      className="object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <a
                        href={order.payment_screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" /> View Full Image
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions & Info */}
          <div className="space-y-6">
            {/* Status Manager */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50">
                <h3 className="font-semibold text-indigo-900">Manage Order</h3>
              </div>
              <div className="p-6">
                <OrderStatusManager
                  orderId={order.id}
                  currentStatus={order.status}
                />
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <User className="h-5 w-5 text-slate-600" />
                <h3 className="font-semibold text-slate-800">
                  Customer Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Full Name</p>
                    <p className="font-medium text-slate-900">
                      {order.user?.full_name || "Guest User"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Mail className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Email</p>
                    <p className="font-medium text-slate-900 break-all">
                      {order.user?.email}
                    </p>
                  </div>
                </div>

                {order.user?.phone && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Phone className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-0.5">Phone</p>
                      <p className="font-medium text-slate-900">
                        {order.user.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* UPDATED: User-Friendly Delivery Details */}
                {order.delivery_details &&
                  Object.keys(order.delivery_details).length > 0 && (
                    <div className="pt-6 border-t border-slate-100 mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">
                            Delivery Info
                          </h4>
                          <p className="text-xs text-slate-500">
                            Required for order fulfillment
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {Object.entries(order.delivery_details).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100"
                            >
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-0">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-sm font-medium text-slate-900 font-mono bg-white px-2.5 py-1 rounded border border-slate-200 select-all">
                                {String(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
