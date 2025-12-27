import { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { Suspense } from "react";
import CheckoutLoadingSkeleton from "./CheckoutLoadingSkeleton";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout - Tronline Bazar",
  description: "Complete your purchase securely",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header - Simplified */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 animate-in zoom-in duration-500">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Secure Checkout</h1>
          <p className="text-slate-600 mt-2">
            Enter your details below to complete your order
          </p>
        </div>

        {/* Removed Progress Steps as requested */}

        {/* Main Content */}
        <Suspense fallback={<CheckoutLoadingSkeleton />}>
          <CheckoutClient />
        </Suspense>
      </div>
    </div>
  );
}
