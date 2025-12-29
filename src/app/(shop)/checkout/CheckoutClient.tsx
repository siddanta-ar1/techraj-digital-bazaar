"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/lib/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  CreditCard,
  Wallet,
  Building,
  Upload,
  AlertCircle,
  Shield,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import OrderSummary from "@/components/checkout/OrderSummary";
import Image from "next/image";

type PaymentMethod = "wallet" | "esewa" | "bank_transfer";

interface DeliveryDetails {
  deliveryMethod: "auto" | "manual";
  contactEmail: string;
  contactPhone: string;
  additionalNotes?: string;
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const supabase = createClient();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    deliveryMethod: "auto",
    contactEmail: user?.email || "",
    contactPhone: user?.phone || "",
    additionalNotes: "",
  });

  // New Manual Payment States
  const [manualAmountPaid, setManualAmountPaid] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!deliveryDetails.contactEmail) newErrors.email = "Email is required";
    if (!deliveryDetails.contactPhone) newErrors.phone = "Phone is required";

    // Manual Payment Validation
    if (paymentMethod !== "wallet") {
      if (!paymentScreenshot)
        newErrors.screenshot = "Payment screenshot is required";
      if (!manualAmountPaid)
        newErrors.amount = "Please enter the amount you paid";
      // Simple check if user paid enough (allow small margin of error if needed, but here strict)
      if (Number(manualAmountPaid) < totalPrice)
        newErrors.amount = `Amount must be at least Rs. ${totalPrice}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      let screenshotUrl = "";

      // Upload logic for manual payments
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

      const orderData = {
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
        paymentMeta: {
          screenshotUrl,
          transactionId,
          amountPaid: manualAmountPaid,
        },
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to create order");

      clearCart();
      router.push(`/checkout/success?orderId=${result.orderId}`);
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs">
                1
              </span>
              Contact Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={deliveryDetails.contactEmail}
                  onChange={(e) =>
                    setDeliveryDetails((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  WhatsApp / Phone
                </label>
                <input
                  type="tel"
                  value={deliveryDetails.contactPhone}
                  onChange={(e) =>
                    setDeliveryDetails((prev) => ({
                      ...prev,
                      contactPhone: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="+977 98..."
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs">
                2
              </span>
              Payment Method
            </h3>

            <div className="grid gap-3 mb-6">
              {/* Wallet Option */}
              <div
                onClick={() => setPaymentMethod("wallet")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "wallet"
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-100 hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Wallet className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">My Wallet</p>
                      <p className="text-sm text-slate-500">
                        Balance: Rs.{" "}
                        {user?.wallet_balance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                  {paymentMethod === "wallet" && (
                    <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                  )}
                </div>
              </div>

              {/* Esewa Option */}
              <div
                onClick={() => setPaymentMethod("esewa")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "esewa"
                    ? "border-green-500 bg-green-50"
                    : "border-slate-100 hover:border-green-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <QrCode className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Esewa / Manual Transfer
                      </p>
                      <p className="text-sm text-slate-500">
                        Scan QR & Upload Screenshot
                      </p>
                    </div>
                  </div>
                  {paymentMethod === "esewa" && (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </div>

              {/* Bank Transfer */}
              <div
                onClick={() => setPaymentMethod("bank_transfer")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "bank_transfer"
                    ? "border-purple-500 bg-purple-50"
                    : "border-slate-100 hover:border-purple-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Building className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Bank Transfer
                      </p>
                      <p className="text-sm text-slate-500">
                        Direct Deposit & Upload Proof
                      </p>
                    </div>
                  </div>
                  {paymentMethod === "bank_transfer" && (
                    <CheckCircle2 className="h-6 w-6 text-purple-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Manual Payment Details Section */}
            {(paymentMethod === "esewa" ||
              paymentMethod === "bank_transfer") && (
              <div className="border-t border-slate-200 pt-6 animate-in fade-in slide-in-from-top-4">
                <div className="bg-slate-50 rounded-lg p-6 mb-6 text-center">
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Scan to Pay
                  </p>
                  {/* QR Code Placeholder - Replace with your actual QR image */}
                  <div className="mx-auto w-48 h-48 bg-white p-2 rounded-lg shadow-sm mb-4 border border-slate-200 flex items-center justify-center">
                    {/* Replace src with your QR code image path */}
                    <QrCode className="h-24 w-24 text-slate-300" />
                  </div>
                  <p className="font-bold text-lg text-slate-900">
                    Rs. {totalPrice.toFixed(2)}
                  </p>
                  <div className="mt-4 text-sm text-slate-600 bg-white p-3 rounded border border-slate-200 inline-block">
                    <p>
                      <strong>Esewa ID:</strong> 98XXXXXXXX
                    </p>
                    <p>
                      <strong>Bank:</strong> Nabil Bank - 1234567890
                    </p>
                    <p>
                      <strong>Name:</strong> TechRaj Digital
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Amount Paid *
                    </label>
                    <input
                      type="number"
                      value={manualAmountPaid}
                      onChange={(e) => setManualAmountPaid(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder={totalPrice.toString()}
                    />
                    {errors.amount && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 1234ABCD"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Upload Payment Screenshot *
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) =>
                          setPaymentScreenshot(e.target.files?.[0] || null)
                        }
                      />
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">
                        {paymentScreenshot
                          ? paymentScreenshot.name
                          : "Click to upload screenshot"}
                      </p>
                    </div>
                    {errors.screenshot && (
                      <p className="text-xs text-red-500 mt-1">
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
              user.wallet_balance < totalPrice && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      Insufficient Balance
                    </p>
                    <p className="text-sm text-amber-700">
                      Please top up your wallet or choose another method.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* RIGHT COLUMN - Summary */}
        <div className="lg:col-span-1">
          <OrderSummary />
          <button
            type="submit"
            disabled={
              isProcessing ||
              (paymentMethod === "wallet" &&
                (user?.wallet_balance ?? 0) < totalPrice)
            }
            className="w-full mt-6 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
          >
            {isProcessing
              ? "Processing..."
              : `Pay Rs. ${totalPrice.toFixed(2)}`}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="h-4 w-4" />
            Secure Encrypted Transaction
          </div>
        </div>
      </div>
    </form>
  );
}
