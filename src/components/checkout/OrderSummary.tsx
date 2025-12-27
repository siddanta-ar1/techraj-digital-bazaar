"use client";

import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import { Package, AlertCircle } from "lucide-react";

export default function OrderSummary() {
  const { items, totalPrice } = useCart();

  const deliveryFee = 0;
  const taxAmount = 0;
  const grandTotal = totalPrice + deliveryFee + taxAmount;

  const hasManualDelivery = items.some(
    (item) =>
      // This would check if product requires manual delivery
      // For now, we'll assume some items might require manual delivery
      false,
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b">
        Order Details
      </h3>

      {/* Items List */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 pb-4 border-b last:border-0"
          >
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={item.imageUrl || "/placeholder-product.jpg"}
                alt={item.productName}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">
                {item.productName}
              </h4>
              <p className="text-sm text-slate-600">{item.variantName}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-slate-500">
                  Qty: {item.quantity}
                </span>
                <span className="font-semibold text-slate-900">
                  Rs. {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Summary */}
      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>Rs. {totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Delivery Fee</span>
          <span>Rs. {deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tax</span>
          <span>Rs. {taxAmount.toFixed(2)}</span>
        </div>
        <div className="pt-4 border-t">
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>Rs. {grandTotal.toFixed(2)}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Payment in NPR</p>
        </div>
      </div>

      {/* Delivery Notice */}
      {hasManualDelivery && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Manual Delivery Required
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Some items in your order require admin verification. Delivery
                may take 1-2 hours during business hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto Delivery Notice */}
      {!hasManualDelivery && items.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Instant Delivery Available
              </p>
              <p className="text-sm text-green-700 mt-1">
                All items in your order support auto-delivery. You'll receive
                them instantly after payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order ID Placeholder */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-sm text-slate-600">
          Order ID will be generated after payment confirmation
        </p>
      </div>
    </div>
  );
}
