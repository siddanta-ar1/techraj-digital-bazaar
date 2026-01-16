"use client";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Wallet,
  Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartClient() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } =
    useCart();
  const { user } = useAuth();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-slate-500 mb-8 max-w-md">
          Looks like you haven't added any game codes or gift cards yet.
        </p>
        <Link
          href="/products"
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <ShoppingBag className="h-8 w-8 text-indigo-600" />
        Shopping Cart
        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full ml-auto md:ml-4">
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 md:gap-6 group hover:border-indigo-200 transition-all"
            >
              {/* Product Image */}
              <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🎮
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-indigo-600 font-medium mt-0.5">
                        {item.variantName}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.variantId,
                          Math.max(1, item.quantity - 1),
                        )
                      }
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-indigo-600 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.variantId,
                          item.quantity + 1,
                        )
                      }
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-indigo-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Total</p>
                    <p className="font-bold text-slate-900">
                      Rs. {(item.price * item.quantity).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-sm text-rose-500 font-medium hover:underline flex items-center gap-1 mt-4 ml-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Shopping Cart
          </button>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Order Summary
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>Rs. {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (0%)</span>
                <span>Rs. 0.00</span>
              </div>
              <div className="h-px bg-slate-100 my-2"></div>
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-indigo-600">
                  Rs. {totalPrice.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Wallet Balance Check */}
            {user && (
              <div
                className={`mb-6 p-3 rounded-xl border ${
                  user.is_synced && user.wallet_balance >= totalPrice
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-amber-50 border-amber-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wallet
                    className={`w-4 h-4 ${
                      user.is_synced && user.wallet_balance >= totalPrice
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      user.is_synced && user.wallet_balance >= totalPrice
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    Wallet Balance
                  </span>
                </div>

                {user.is_synced ? (
                  <div className="flex items-end justify-between">
                    <span className="font-bold text-slate-900">
                      Rs. {user.wallet_balance.toFixed(2)}
                    </span>
                    {user.wallet_balance < totalPrice && (
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-amber-200 text-amber-700 font-medium">
                        Need Topup
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-6 w-24 bg-slate-200/50 animate-pulse rounded mt-1" />
                )}
              </div>
            )}

            <button
              onClick={() => router.push("/checkout")}
              disabled={items.length === 0}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Shield className="w-3.5 h-3.5" />
                Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
