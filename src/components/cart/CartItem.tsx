"use client";

import { CartItem as CartItemType } from "@/types/cart";
import { Trash2, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-white hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      {/* Product Info Group */}
      <div className="flex items-start gap-4 flex-1">
        {/* Product Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
          <Image
            src={item.imageUrl || "/placeholder-product.jpg"}
            alt={item.productName}
            fill
            className="object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-base sm:text-lg line-clamp-2">
            {item.productName}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {item.variantName}
          </p>
          <p className="text-sm font-bold text-indigo-600 mt-1 sm:hidden">
            Rs. {item.price.toFixed(2)}
          </p>
          <p className="hidden sm:block text-sm text-slate-500 mt-1">
            Unit Price: Rs. {item.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Actions Group (Quantity + Total + Remove) */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:border-none">
        {/* Quantity Controls */}
        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="p-2 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50"
            aria-label="Decrease quantity"
            disabled={item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="w-10 text-center font-semibold text-slate-900 text-sm">
            {item.quantity}
          </span>

          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Total & Remove */}
        <div className="text-right flex flex-col items-end">
          <p className="text-base sm:text-lg font-bold text-slate-900">
            Rs. {(item.price * item.quantity).toFixed(2)}
          </p>
          <button
            onClick={() => removeItem(item.id)}
            className="mt-1 text-xs sm:text-sm font-medium text-rose-500 hover:text-rose-700 flex items-center gap-1.5 transition-colors py-1 px-2 rounded hover:bg-rose-50 -mr-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
