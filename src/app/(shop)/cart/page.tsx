import { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { Suspense } from "react";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Shopping Cart - Tronline Bazar",
  description: "Review and manage your shopping cart",
};

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8 bg-slate-50 min-h-[calc(100vh-80px)]">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
          </div>
          Shopping Cart
        </h1>
        <p className="text-slate-500 mt-2 ml-1 text-sm md:text-base">
          Review your items and proceed to secure checkout
        </p>
      </div>

      <Suspense fallback={<CartLoadingSkeleton />}>
        <CartClient />
      </Suspense>
    </div>
  );
}

function CartLoadingSkeleton() {
  return (
    <div className="animate-pulse grid lg:grid-cols-3 gap-8">
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
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
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
  );
}
