"use client";

import { useCart } from "@/contexts/CartContext";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import EmptyCart from "@/components/cart/EmptyCart";

export default function CartClient() {
  const { items, clearCart } = useCart();

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 pb-12">
      {/* Cart Items List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">
              Your Items ({items.length})
            </h2>
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
            >
              Clear Cart
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center mt-6 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>
      </div>

      {/* Summary Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <CartSummary />

        {/* Trust/Info Box */}
        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <div className="flex items-start gap-3">
            <ShoppingBag className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <h4 className="font-semibold text-indigo-900 text-sm">
                Buyer Protection
              </h4>
              <p className="text-xs text-indigo-700 mt-1">
                Full refund if you don't receive your order. Manual delivery
                items are verified by our team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
