"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  Loader2,
  Package,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function RefundPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [issueType, setIssueType] = useState("code_invalid");
  const [description, setDescription] = useState("");

  const ADMIN_PHONE =
    process.env.NEXT_PUBLIC_CONTACT_PHONE?.replace("+", "") || "9779846908072";

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/refund");
      return;
    }

    if (user) {
      const fetchOrders = async () => {
        const { data } = await supabase
          .from("orders")
          .select(
            "*, order_items(*, variant:product_variants(variant_name, product:products(name)))",
          )
          .eq("user_id", user.id)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false });

        if (data) setOrders(data);
        setLoadingOrders(false);
      };
      fetchOrders();
    }
  }, [user, isLoading, router, supabase]);

  const handleSendRequest = () => {
    if (!selectedOrder || !selectedItem) return;

    const order = orders.find((o) => o.id === selectedOrder);
    const item = order?.order_items.find((i: any) => i.id === selectedItem);
    if (!order || !item) return;

    const message = `
*Refund / Support Request*
------------------
*User:* ${user?.email}
*Order No:* ${order.order_number}
*Product:* ${item.variant.product.name} (${item.variant.variant_name})
*Issue:* ${issueType}

*Details:*
${description || "No extra details provided."}
    `.trim();

    window.open(
      `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  if (isLoading || loadingOrders) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Refund & Support
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto text-sm md:text-base">
            Select an item from your order history and tell us what went wrong.
            Our support team will assist you via WhatsApp.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Select Order Item
            </h2>
          </div>

          <div className="p-6 space-y-8">
            {orders.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-900 font-medium mb-2">
                  No orders found
                </p>
                <p className="text-slate-500 mb-6 text-sm">
                  You haven’t purchased anything yet.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center text-indigo-600 font-semibold hover:underline"
                >
                  Browse Products <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <>
                {/* Order List */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">
                    1. Which order has the issue?
                  </label>

                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order.id);
                        setSelectedItem("");
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedOrder === order.id
                          ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/10"
                          : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono font-bold text-slate-900">
                          {order.order_number}
                        </span>
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {selectedOrder === order.id && (
                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
                            Select Product
                          </p>

                          {order.order_items.map((item: any) => (
                            <div
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item.id);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                                selectedItem === item.id
                                  ? "bg-white ring-2 ring-indigo-500 shadow-sm"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedItem === item.id
                                    ? "bg-indigo-600 border-indigo-600"
                                    : "border-slate-300"
                                }`}
                              >
                                {selectedItem === item.id && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.variant.product.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.variant.variant_name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Issue Section */}
                <div
                  className={`space-y-4 ${
                    !selectedItem
                      ? "opacity-50 pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  <hr className="border-slate-200 my-6" />

                  <label className="block text-sm font-semibold text-slate-700">
                    2. What is the issue?
                  </label>

                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="code_invalid">Code not working</option>
                    <option value="not_received">Code not received</option>
                    <option value="wrong_item">Wrong item received</option>
                    <option value="other">Other issue</option>
                  </select>

                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue briefly..."
                      className="w-full h-32 p-4 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <AlertCircle className="absolute bottom-3 right-3 w-4 h-4 text-slate-300" />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    onClick={handleSendRequest}
                    disabled={!selectedItem}
                    className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white py-4 rounded-xl font-bold text-base transition-all shadow-md shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat with Support on WhatsApp
                  </button>

                  <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Order details are shared automatically
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
