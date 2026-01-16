"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/lib/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  Wallet,
  Building,
  Upload,
  AlertCircle,
  Shield,
  CheckCircle2,
  QrCode,
  Smartphone,
  ChevronRight,
  Loader2,
  MessageCircle,
} from "lucide-react";
import OrderSummary from "@/components/checkout/OrderSummary";

type PaymentMethod = "wallet" | "esewa" | "bank_transfer";

interface DeliveryDetails {
  contactEmail: string;
  contactPhone: string;
  additionalNotes?: string;
}

export default function CheckoutClient() {
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Add this handler
  const handleApplyPromo = async () => {
    // Call API to validate promo (or query supabase directly since we have public read access)
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (data) {
      // Basic Client-side calc (Server verifies again)
      let discount = 0;
      if (data.discount_type === "percentage") {
        discount = (totalPrice * data.discount_value) / 100;
      } else {
        discount = data.discount_value;
      }
      setAppliedDiscount(discount);
      // Show success toast/message
    } else {
      // Show error
      setErrors({ ...errors, promo: "Invalid Code" });
    }
  };
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const supabase = createClient();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    contactEmail: user?.email || "",
    contactPhone: user?.phone || "",
    additionalNotes: "",
  });

  const [manualAmountPaid, setManualAmountPaid] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!deliveryDetails.contactEmail) newErrors.email = "Email is required";
    if (!deliveryDetails.contactPhone) newErrors.phone = "Phone is required";

    if (paymentMethod !== "wallet") {
      if (!paymentScreenshot)
        newErrors.screenshot =
          "Payment screenshot is required for manual payment";
      if (!manualAmountPaid)
        newErrors.amount = "Please enter the amount you paid";
      // Ensure amount is string before comparison
      if (parseFloat(manualAmountPaid || "0") < totalPrice)
        newErrors.amount = `Amount must be at least Rs. ${totalPrice}`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Improved WhatsApp function to handle the final URL redirect
  const triggerWhatsappNotification = (orderNumber: string) => {
    const adminPhone = "9779846908072"; // Admin Number
    const message = `
  *New Order Placed!* 🛍️
  ------------------
  *Order No:* ${orderNumber}
  *Amount:* Rs. ${totalPrice.toFixed(2)}
  *Payment:* ${paymentMethod.toUpperCase()}
  *Txn ID:* ${transactionId || "N/A"}

  I have placed an order and uploaded the screenshot on the website. Please verify.
      `.trim();

    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    // Use location.href to avoid browser popup blockers after async calls
    window.location.href = whatsappUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      let screenshotUrl = "";

      // 1. Upload screenshot if manual payment
      if (paymentMethod !== "wallet" && paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split(".").pop();
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-screenshots")
          .upload(fileName, paymentScreenshot);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("payment-screenshots").getPublicUrl(fileName);

        screenshotUrl = publicUrl;
      }

      // 2. Save order to database via API
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod,
        totalAmount: totalPrice,
        deliveryDetails: {
          contactEmail: deliveryDetails.contactEmail,
          contactPhone: deliveryDetails.contactPhone,
          notes: deliveryDetails.additionalNotes,
        },
        paymentScreenshotUrl: screenshotUrl,
        paymentMeta: {
          transactionId: transactionId,
          amountPaid: manualAmountPaid,
        },
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create order");
      }

      // 3. Clear cart and trigger WhatsApp
      clearCart();

      // We trigger WhatsApp and the browser will navigate away.
      // The user can return to the dashboard later.
      triggerWhatsappNotification(result.orderNumber);
    } catch (error: any) {
      console.error("Checkout Error:", error);
      setErrors({
        submit: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-12">
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* 1. Contact Info */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* ... (Keep existing contact info section) ... */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-sm shadow-indigo-200">
                  1
                </span>
                Contact Information
              </h3>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={deliveryDetails.contactEmail}
                  onChange={(e) =>
                    setDeliveryDetails((p) => ({
                      ...p,
                      contactEmail: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Phone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={deliveryDetails.contactPhone}
                  onChange={(e) =>
                    setDeliveryDetails((p) => ({
                      ...p,
                      contactPhone: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="+977 98..."
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 2. Payment Method */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-sm shadow-indigo-200">
                  2
                </span>
                Select Payment Method
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Wallet Option */}
              <label
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "wallet" ? "border-indigo-600 bg-indigo-50/30" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  className="hidden"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                />
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-3 rounded-full ${paymentMethod === "wallet" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      My Wallet Balance
                    </div>
                    <div className="text-sm text-slate-500 font-medium">
                      Available: Rs.{" "}
                      {user?.wallet_balance?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
                {paymentMethod === "wallet" && (
                  <CheckCircle2 className="h-6 w-6 text-indigo-600 animate-in zoom-in" />
                )}
              </label>

              {/* Esewa Option */}
              <label
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "esewa" ? "border-green-500 bg-green-50/30" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  className="hidden"
                  checked={paymentMethod === "esewa"}
                  onChange={() => setPaymentMethod("esewa")}
                />
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-3 rounded-full ${paymentMethod === "esewa" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      Esewa / Khalti
                    </div>
                    <div className="text-sm text-slate-500">
                      Scan QR code & upload screenshot
                    </div>
                  </div>
                </div>
                {paymentMethod === "esewa" && (
                  <CheckCircle2 className="h-6 w-6 text-green-600 animate-in zoom-in" />
                )}
              </label>

              {/* Bank Option */}
              <label
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "bank_transfer" ? "border-purple-500 bg-purple-50/30" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  className="hidden"
                  checked={paymentMethod === "bank_transfer"}
                  onChange={() => setPaymentMethod("bank_transfer")}
                />
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-3 rounded-full ${paymentMethod === "bank_transfer" ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Building className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      Bank Transfer
                    </div>
                    <div className="text-sm text-slate-500">
                      Direct deposit & upload receipt
                    </div>
                  </div>
                </div>
                {paymentMethod === "bank_transfer" && (
                  <CheckCircle2 className="h-6 w-6 text-purple-600 animate-in zoom-in" />
                )}
              </label>
            </div>

            {/* Manual Payment Section (Shown for BOTH Esewa and Bank) */}
            {(paymentMethod === "esewa" ||
              paymentMethod === "bank_transfer") && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2">
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 text-center shadow-sm">
                  <div className="mx-auto w-40 h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center mb-4 text-slate-400">
                    <QrCode className="h-12 w-12 mb-2" />
                    <span className="text-xs font-medium">QR CODE</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600 mb-2">
                    Send Payment To:
                  </div>
                  <div className="font-mono text-lg font-bold text-slate-900 bg-slate-100 py-2 px-4 rounded-lg inline-block mb-1">
                    9846908072
                  </div>
                  <div className="text-xs text-slate-500">
                    TechRaj Digital / Esewa ID
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Amount Paid <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                        Rs.
                      </span>
                      <input
                        type="number"
                        value={manualAmountPaid}
                        onChange={(e) => setManualAmountPaid(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        placeholder={totalPrice.toString()}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.amount}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Required for verification"
                    />
                  </div>

                  {/* File Upload visible for BOTH */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Upload Screenshot <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) =>
                          setPaymentScreenshot(e.target.files?.[0] || null)
                        }
                      />
                      <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                          {paymentScreenshot
                            ? paymentScreenshot.name
                            : "Click to upload screenshot"}
                        </p>
                        <p className="text-xs text-slate-400">
                          JPG, PNG up to 5MB
                        </p>
                      </div>
                    </div>
                    {errors.screenshot && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.screenshot}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Error */}
            {paymentMethod === "wallet" &&
              user &&
              (user.wallet_balance || 0) < totalPrice && (
                <div className="p-6 border-t border-slate-100 bg-amber-50/50">
                  <div className="flex gap-3 items-start p-4 bg-white border border-amber-200 rounded-xl shadow-sm">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">
                        Insufficient Wallet Balance
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Please top-up your wallet or select a different payment
                        method.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <OrderSummary />
            <div className="flex gap-2 mb-4">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Promo Code"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                Apply
              </button>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-green-600 text-sm font-bold mb-4">
                <span>Discount</span>
                <span>- Rs. {appliedDiscount.toFixed(2)}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={
                isProcessing ||
                (paymentMethod === "wallet" &&
                  (user?.wallet_balance ?? 0) < totalPrice)
              }
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay Rs. {totalPrice.toFixed(2)}
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 py-2 rounded-lg">
              <Shield className="h-4 w-4 text-emerald-600" />
              100% Secure Encrypted Payment
            </div>
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center font-medium animate-in shake">
                {errors.submit}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
