"use client";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/lib/providers/AuthProvider";
import { ShoppingBag, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";

export default function OrderSummary() {
  const { totalPrice, items } = useCart();
  const { user } = useAuth();

  const deliveryFee = 0;
  const grandTotal = totalPrice + deliveryFee;
  // Fallback to 0 if wallet_balance is undefined
  const walletBalance = user?.wallet_balance ?? 0;
  const hasBalance = walletBalance >= grandTotal;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-8">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-600" />
          Order Summary
        </h3>
      </div>

      <div className="p-5 space-y-6">
        {/* Items List (Compact Mode) */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <div className="flex-1">
                <p className="text-slate-700 font-medium line-clamp-2">
                  {item.productName}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Qty: {item.quantity} × Rs. {item.price.toFixed(2)}
                </p>
              </div>
              <div className="font-bold text-slate-900">
                Rs. {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Calculations */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium">Rs. {totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="text-emerald-600 font-medium">Free</span>
          </div>
          <div className="pt-3 flex justify-between items-end border-t border-slate-100 mt-3">
            <span className="font-bold text-slate-900 text-base">Total</span>
            <div className="text-right">
              <span className="block text-xl font-black text-indigo-600">
                Rs. {grandTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                Includes all taxes
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Balance Status (Compact) */}
        {user && (
          <div
            className={`p-3 rounded-xl border ${
              hasBalance
                ? "bg-emerald-50 border-emerald-100"
                : "bg-amber-50 border-amber-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Wallet
                  className={`h-4 w-4 ${
                    hasBalance ? "text-emerald-600" : "text-amber-600"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    hasBalance ? "text-emerald-800" : "text-amber-800"
                  }`}
                >
                  Wallet Balance
                </span>
              </div>
              <span
                className={`text-sm font-bold ${
                  hasBalance ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                Rs. {walletBalance.toFixed(2)}
              </span>
            </div>

            {!hasBalance && (
              <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                Short by Rs. {(grandTotal - walletBalance).toFixed(2)}
              </p>
            )}

            {hasBalance && (
              <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Sufficient balance available
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
