import { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { Suspense } from "react";
import CheckoutLoadingSkeleton from "./CheckoutLoadingSkeleton";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Secure Checkout - Tronline Bazar",
  description: "Complete your purchase securely",
};

export default function CheckoutPage() {
  return (
    // MATCHED: min-h-screen, bg-slate-50, and padding/max-width from Cart page
    <div className="min-h-screen bg-slate-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header - Center Aligned & Clean */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm">
            <LockKeyhole className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] md:text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Secure SSL Checkout
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Complete Your Order
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            Please enter your payment & delivery details below.
          </p>
        </div>

        {/* Main Content */}
        <Suspense fallback={<CheckoutLoadingSkeleton />}>
          <CheckoutClient />
        </Suspense>
      </div>
    </div>
  );
}
