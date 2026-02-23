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
  ChevronLeft,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUpload } from "@/hooks/useSupabaseUpload";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ... [Keep interfaces identical] ...
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
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "refunded":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
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

  // TUS Resumable Upload for payment proof
  const { upload: tusUpload, progress: uploadProgress, isUploading: uploading, abort: abortUpload } = useSupabaseUpload({
    bucket: "orders",
    onSuccess: async (publicUrl) => {
      try {
        await supabase
          .from("orders")
          .update({
            payment_screenshot_url: publicUrl,
            payment_status: "pending",
          })
          .eq("id", order.id);

        alert("Proof uploaded successfully!");
        router.refresh();
      } catch {
        alert("File uploaded but failed to update order. Please contact support.");
      }
    },
    onError: () => {
      alert("Failed to upload proof");
    },
  });

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const fileExt = file.name.split(".").pop();
    const fileName = `${order.id}-${Math.random()}.${fileExt}`;
    const filePath = `payments/${fileName}`;

    await tusUpload(file, filePath);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Order #{order.order_number}
            </h1>
            <p className="text-slate-500">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Download className="h-4 w-4" /> Invoice
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <MessageSquare className="h-4 w-4" /> Support
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Tracker */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Order Status</h3>
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100" />

              {[
                {
                  label: "Order Placed",
                  date: order.created_at,
                  active: true,
                  icon: Package,
                },
                {
                  label: "Payment",
                  active: order.payment_status === "paid",
                  icon: CreditCard,
                  subtext:
                    order.payment_status === "paid"
                      ? "Paid"
                      : "Pending Payment",
                },
                {
                  label: "Processing",
                  active:
                    order.status === "processing" ||
                    order.status === "completed",
                  icon: Clock,
                },
                {
                  label: "Delivered",
                  active: order.status === "completed",
                  icon: CheckCircle,
                  subtext:
                    order.status === "completed"
                      ? "Complete"
                      : order.delivery_type === "auto"
                        ? "Auto-Delivery"
                        : "Manual Delivery",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="relative flex items-start gap-4 mb-8 last:mb-0"
                >
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.active
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-slate-200 text-slate-300"
                      }`}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div className="pt-1">
                    <p
                      className={`font-medium ${step.active ? "text-slate-900" : "text-slate-400"
                        }`}
                    >
                      {step.label}
                    </p>
                    {step.subtext && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {step.subtext}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Items</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200 flex-shrink-0">
                      {item.variant.product.featured_image ? (
                        <Image
                          src={item.variant.product.featured_image}
                          alt={item.variant.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">
                        {item.variant.product.name}
                      </h4>
                      <p className="text-sm text-slate-500 mb-2">
                        {item.variant.variant_name} × {item.quantity}
                      </p>

                      {/* Delivery Code Section */}
                      {item.delivered_code && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3 inline-block max-w-full">
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                            Your Code:
                          </p>
                          <div className="flex items-center gap-3">
                            <code className="font-mono text-emerald-900 font-bold text-lg">
                              {item.delivered_code}
                            </code>
                            <button
                              onClick={() =>
                                handleCopyCode(item.delivered_code!)
                              }
                              className="text-emerald-600 hover:text-emerald-800 transition-colors"
                              title="Copy Code"
                            >
                              {copiedCode === item.delivered_code ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        Rs. {item.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Payment Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>
                  Rs.{" "}
                  {order.order_items
                    .reduce((sum, i) => sum + i.total_price, 0)
                    .toFixed(2)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-Rs. {order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>Rs. {order.final_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Payment Method
              </p>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 capitalize">
                  {order.payment_method.replace("_", " ")}
                </span>
                <span
                  className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${order.payment_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                    }`}
                >
                  {order.payment_status}
                </span>
              </div>
            </div>

            {/* Payment Proof Upload */}
            {order.payment_method === "bank_transfer" &&
              order.payment_status === "pending" && (
                <div className="mt-6">
                  <label className="block w-full cursor-pointer bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center hover:bg-indigo-100 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadProof}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="space-y-3">
                        <span className="text-indigo-600 font-medium">
                          Uploading... {uploadProgress}%
                        </span>
                        <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            abortUpload();
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-indigo-600" />
                        <span className="text-indigo-700 font-medium text-sm">
                          Upload Payment Proof
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              )}
          </div>

          {/* Delivery Info */}
          {order.delivery_details && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Delivery Info</h3>
              <div className="space-y-4 text-sm">
                {Object.entries(order.delivery_details).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="font-medium text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
