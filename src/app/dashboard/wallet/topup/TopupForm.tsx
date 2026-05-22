"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type PaymentMethod = "esewa" | "bank_transfer";

export default function TopupForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("esewa");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: user } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", session.user.id)
        .single();
      setUserBalance(user?.wallet_balance || 0);
    }
  };

  const handleAmountClick = (value: string) => setAmount(value);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) < 100) {
      newErrors.amount = "Minimum amount is Rs. 100";
    } else if (parseFloat(amount) > 50000) {
      newErrors.amount = "Maximum amount is Rs. 50,000 per day";
    }

    if (!screenshot) {
      newErrors.screenshot = "Payment screenshot is required";
    } else if (screenshot.size > 5 * 1024 * 1024) {
      newErrors.screenshot = "File size must be less than 5MB";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // 1. Upload screenshot first
      if (!screenshot) throw new Error("Screenshot is required");

      const formData = new FormData();
      formData.append("file", screenshot);

      const uploadRes = await fetch("/api/upload/payment-screenshot", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json();
        throw new Error(uploadErr.error || "Failed to upload screenshot");
      }

      const { url: screenshotUrl } = await uploadRes.json();

      // 2. Submit top-up request with the uploaded URL
      const response = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          transactionId: transactionId || `TR-${Date.now()}`,
          screenshotUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create top-up");

      setSuccessMessage("Top-up request submitted! We will review and approve it shortly.");

      // Redirect after short delay
      setTimeout(() => router.push("/dashboard/wallet"), 2000);
    } catch (error: any) {
      setErrors({ submit: error.message });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Balance */}
      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <span className="text-sm font-medium text-indigo-700">Current Balance</span>
        <span className="text-lg font-bold text-indigo-900">Rs. {userBalance.toFixed(2)}</span>
      </div>

      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Amount (NPR) *
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
          {["100", "500", "1000", "2000", "5000"].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => handleAmountClick(value)}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                amount === value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Rs. {value}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter custom amount"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          min="100"
          max="50000"
        />
        {errors.amount && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" /> {errors.amount}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Payment Method *
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("esewa")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === "esewa"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${paymentMethod === "esewa" ? "bg-indigo-100" : "bg-slate-100"}`}>
                <div className="h-6 w-6 bg-green-500 rounded" />
              </div>
              <div>
                <div className="font-medium text-slate-900">eSewa</div>
                <div className="text-sm text-slate-500">Scan & Upload screenshot</div>
              </div>
              {paymentMethod === "esewa" && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === "bank_transfer"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${paymentMethod === "bank_transfer" ? "bg-indigo-100" : "bg-slate-100"}`}>
                <div className="h-6 w-6 bg-purple-500 rounded" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Bank Transfer</div>
                <div className="text-sm text-slate-500">Scan & Upload screenshot</div>
              </div>
              {paymentMethod === "bank_transfer" && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
            </div>
          </button>
        </div>
      </div>

      {/* Transaction ID */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Transaction ID <span className="text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="e.g. 23XX89"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Screenshot Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Payment Screenshot *
        </label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
          {screenshot ? (
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 truncate max-w-[200px]">{screenshot.name}</p>
                  <p className="text-xs text-slate-500">{(screenshot.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <span className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Choose File
              </span>
              <p className="text-xs text-slate-400 mt-2">JPEG, PNG, WebP — max 5 MB</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          )}
        </div>
        {errors.screenshot && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" /> {errors.screenshot}
          </p>
        )}
      </div>

      {/* Confirmation */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <input
          type="checkbox"
          id="terms"
          required
          className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="terms" className="text-sm text-slate-600">
          I confirm that I have completed the payment and the details provided are accurate.
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-lg font-semibold text-base transition-colors flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading & Submitting...
          </>
        ) : (
          `Submit Top-up Request (Rs. ${amount || "0"})`
        )}
      </button>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {errors.submit}
        </div>
      )}
    </form>
  );
}
