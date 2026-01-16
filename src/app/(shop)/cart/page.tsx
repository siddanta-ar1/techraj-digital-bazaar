import { Metadata } from "next";
import { Suspense } from "react";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Shopping Cart - Tronline Bazar",
  description: "Review and manage your shopping cart",
};

export default function CartPage() {
  return (
    // FIX: Applied bg-slate-50 to full width div, removed 'container' from here
    <div className="min-h-screen bg-slate-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <Suspense fallback={<CartLoadingSkeleton />}>
          <CartClient />
        </Suspense>
      </div>
    </div>
  );
}

function CartLoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-48 mb-8"></div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-slate-100 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
            <div className="h-6 bg-slate-100 rounded w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-12 bg-slate-100 rounded w-full mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
