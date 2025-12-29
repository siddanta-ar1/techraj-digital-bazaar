"use client";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/lib/providers/AuthProvider";
import { ShoppingBag, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CartSummary() {
  const { totalPrice, totalItems, items } = useCart();
  const { user } = useAuth();

  const deliveryFee = 0;
  const taxAmount = 0;
  const grandTotal = totalPrice + deliveryFee + taxAmount;
  const hasWallet = user?.wallet_balance
    ? user.wallet_balance >= grandTotal
    : false;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 sticky top-24">
      <h2 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
        Order Summary
      </h2>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-slate-600 text-sm">
          <span>Subtotal ({totalItems} items)</span>
          <span className="font-semibold text-slate-900">
            Rs. {totalPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600 text-sm">
          <span>Delivery Fee</span>
          <span className="text-emerald-600 font-medium">Free</span>
        </div>
        <div className="pt-3 border-t border-slate-100 mt-3">
          <div className="flex justify-between items-end">
            <span className="text-slate-900 font-bold">Total</span>
            <div className="text-right">
              <span className="block text-xl font-black text-indigo-600">
                Rs. {grandTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Includes all taxes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balance */}
      {user && (
        <div
          className={`mb-6 p-4 rounded-lg border ${hasWallet ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet
                className={`h-4 w-4 ${hasWallet ? "text-emerald-600" : "text-amber-600"}`}
              />
              <span
                className={`text-sm font-bold ${hasWallet ? "text-emerald-800" : "text-amber-800"}`}
              >
                Wallet Balance
              </span>
            </div>
            <span
              className={`font-bold ${hasWallet ? "text-emerald-700" : "text-amber-700"}`}
            >
              Rs. {user.wallet_balance?.toFixed(2) || "0.00"}
            </span>
          </div>

          {hasWallet ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Balance sufficient</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>
                Top-up needed (Rs.{" "}
                {(grandTotal - (user.wallet_balance || 0)).toFixed(2)} more)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Checkout Button */}
      <Link
        href="/checkout"
        className={`w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200
          ${
            items.length === 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
          }`}
      >
        {items.length === 0 ? "Cart is Empty" : "Proceed to Checkout"}
      </Link>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          We Accept
        </p>
        <div className="flex gap-2">
          {["Esewa", "Khalti", "Bank Transfer"].map((method) => (
            <div
              key={method}
              className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase rounded border border-slate-200"
            >
              {method}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
