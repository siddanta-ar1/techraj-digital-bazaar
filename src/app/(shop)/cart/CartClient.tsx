"use client";

import { useCart } from "@/contexts/CartContext";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import EmptyCart from "@/components/cart/EmptyCart";

export default function CartClient() {
  const { items, clearCart } = useCart();

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 pb-12">
      {/* Cart Items List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              Your Items{" "}
              <span className="text-slate-500 font-normal">
                ({items.length})
              </span>
            </h2>
            <button
              onClick={clearCart}
              className="text-xs sm:text-sm text-rose-600 hover:text-rose-700 font-medium hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors p-2 -ml-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>
      </div>

      {/* Summary Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <CartSummary />

        {/* Trust/Info Box */}
        <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-full shrink-0">
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Buyer Protection
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
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
