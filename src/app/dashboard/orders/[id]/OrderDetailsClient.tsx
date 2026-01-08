// src/app/dashboard/orders/[id]/OrderDetailsClient.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Download,
  Copy,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OrderItem {
  id: string;
  variant: {
    variant_name: string;
    product: {
      name: string;
      featured_image: string;
    };
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  delivered_code?: string;
}

interface Order {
  id: string;
  order_number: string;
  user: {
    full_name: string;
    email: string;
    phone: string;
  };
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_method: "wallet" | "esewa" | "bank_transfer";
  payment_status: "pending" | "paid" | "failed";
  payment_screenshot_url?: string;
  delivery_type: "auto" | "manual";
  delivery_details: any;
  admin_notes?: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderDetailsClientProps {
  order: Order;
}

export default function OrderDetailsClient({ order }: OrderDetailsClientProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const supabase = createClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getPaymentIcon = () => {
    switch (order.payment_method) {
      case "wallet":
        return <CreditCard className="h-5 w-5 text-indigo-600" />;
      case "esewa":
        return <div className="h-5 w-5 bg-blue-500 rounded"></div>;
      case "bank_transfer":
        return <div className="h-5 w-5 bg-purple-500 rounded"></div>;
      default:
        return null;
    }
  };

  const getDeliveryIcon = () => {
    return order.delivery_type === "auto" ? (
      <Truck className="h-5 w-5 text-green-600" />
    ) : (
      <Package className="h-5 w-5 text-blue-600" />
    );
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${order.id}-${Math.random()}.${fileExt}`;
    const filePath = `payments/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("orders") // Ensure this bucket exists in Supabase
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("orders").getPublicUrl(filePath);

      await supabase
        .from("orders")
        .update({
          payment_screenshot_url: publicUrl,
          payment_status: "pending",
        })
        .eq("id", order.id);

      alert("Proof uploaded successfully!");
      location.reload();
    } catch (error) {
      alert("Failed to upload proof");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const deliveredItems = order.order_items.filter(
    (item) => item.delivered_code,
  );
  const pendingItems = order.order_items.filter((item) => !item.delivered_code);

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.total_price,
    0,
  );
  const discount = order.discount_amount || 0;
  const total = order.final_amount;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left Column - Order Details */}
      <div className="lg:col-span-2 space-y-8">
        {/* Order Status Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Order Status
          </h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            {[
              {
                status: "Order Placed",
                active: true,
                time: formatDate(order.created_at),
                icon: Package,
              },
              {
                status: "Payment",
                active: order.payment_status === "paid",
                time:
                  order.payment_status === "paid"
                    ? "Payment successful"
                    : "Pending payment",
                icon: CreditCard,
              },
              {
                status: "Processing",
                active:
                  order.status === "processing" || order.status === "completed",
                time:
                  order.status === "processing"
                    ? "Currently processing"
                    : "Processed",
                icon: Clock,
              },
              {
                status:
                  order.delivery_type === "auto"
                    ? "Auto Delivery"
                    : "Manual Delivery",
                active:
                  order.status === "completed" || deliveredItems.length > 0,
                time:
                  deliveredItems.length > 0
                    ? `${deliveredItems.length} item${deliveredItems.length !== 1 ? "s" : ""} delivered`
                    : "Pending",
                icon: Truck,
              },
              {
                status: "Completed",
                active: order.status === "completed",
                time:
                  order.status === "completed"
                    ? "Order completed"
                    : "Not completed",
                icon: CheckCircle,
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative flex items-start mb-8 last:mb-0"
                >
                  <div
                    className={`z-10 flex items-center justify-center w-12 h-12 rounded-full ${
                      step.active ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        step.active ? "text-white" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div className="ml-4">
                    <h3
                      className={`font-medium ${
                        step.active ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {step.status}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">{step.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Order Items
          </h2>
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={
                      item.variant.product.featured_image ||
                      "/placeholder-product.jpg"
                    }
                    alt={item.variant.product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">
                    {item.variant.product.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {item.variant.variant_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    Quantity: {item.quantity}
                  </p>
                  {item.delivered_code && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          Delivered
                        </span>
                        <div className="flex-1 bg-slate-100 px-3 py-1 rounded flex items-center justify-between">
                          <code className="text-sm font-mono">
                            {item.delivered_code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(item.delivered_code!)}
                            className="ml-2 text-indigo-600 hover:text-indigo-700"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {copiedCode === item.delivered_code && (
                        <p className="text-xs text-green-600 mt-1">
                          Copied to clipboard!
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">
                    Rs. {item.total_price.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Rs. {item.unit_price.toFixed(2)} each
                  </p>
                  <div
                    className={`mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : item.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-medium text-green-600">
                    -Rs. {discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-lg font-bold text-slate-900">
                  Rs. {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Instructions */}
        {order.delivery_details && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              Delivery Instructions
            </h2>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-slate-700">
                {order.delivery_type === "auto"
                  ? "This product will be delivered automatically. You will receive the delivery code in your email."
                  : "This product requires manual delivery. Our team will process it within 1-2 hours during business hours."}
              </p>
              {order.delivery_details.contactEmail && (
                <p className="text-sm text-slate-600 mt-2">
                  Contact email: {order.delivery_details.contactEmail}
                </p>
              )}
              {order.delivery_details.contactPhone && (
                <p className="text-sm text-slate-600">
                  Contact phone: {order.delivery_details.contactPhone}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Order Info & Actions */}
      <div className="lg:col-span-1 space-y-6">
        {/* Order Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Order Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Order Number</p>
              <p className="font-medium text-slate-900">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Order Date</p>
              <p className="font-medium text-slate-900">
                {formatDate(order.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Payment Method</p>
              <div className="flex items-center gap-2 mt-1">
                {getPaymentIcon()}
                <span className="font-medium text-slate-900 capitalize">
                  {order.payment_method.replace("_", " ")}
                </span>
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    order.payment_status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Delivery Type</p>
              <div className="flex items-center gap-2 mt-1">
                {getDeliveryIcon()}
                <span className="font-medium text-slate-900 capitalize">
                  {order.delivery_type} Delivery
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Order Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Customer Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="font-medium text-slate-900">
                {order.user?.full_name || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{order.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="font-medium text-slate-900">
                {order.user?.phone || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
          <div className="space-y-3">
            {order.payment_method === "bank_transfer" &&
              order.payment_status === "pending" && (
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleUploadProof}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium">
                    <AlertCircle className="h-4 w-4" />
                    Select & Upload Proof
                  </button>
                </div>
              )}

            <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
              <Download className="h-4 w-4" />
              Download Invoice
            </button>

            <button className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg font-medium border border-slate-300 hover:bg-slate-50">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </button>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="font-semibold mb-3">Need Help?</h3>
          <p className="text-sm opacity-90 mb-4">
            Having issues with your order? Contact our support team.
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 opacity-80" />
              <span>WhatsApp: +977 9846908072</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="opacity-80">Email:</span>
              <span className="font-medium">support@tronlinebazar.com</span>
            </p>
          </div>
          <button className="mt-4 w-full bg-white text-indigo-600 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors">
            <ExternalLink className="h-4 w-4 inline mr-2" />
            Open WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
