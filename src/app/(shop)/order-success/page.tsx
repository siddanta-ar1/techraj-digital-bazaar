"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Package, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!orderNumber) {
      router.push("/");
      return;
    }

    // Countdown timer for redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard/orders");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderNumber, router]);

  if (!orderNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Order Number</span>
            <span className="font-mono font-semibold text-gray-900">
              {orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Clock className="w-4 h-4" />
            <span>Processing your order...</span>
          </div>
        </div>

        {/* What's Next */}
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">What's Next?</h2>
          <div className="space-y-3 text-sm text-left">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900">Email Confirmation</div>
                <div className="text-gray-600">
                  You'll receive an order confirmation email shortly
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900">Digital Delivery</div>
                <div className="text-gray-600">
                  Digital products will be delivered instantly to your email
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900">Order Tracking</div>
                <div className="text-gray-600">
                  Track your order status in your dashboard
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard/orders"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            View My Orders
          </Link>

          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Auto Redirect Notice */}
        <div className="mt-6 text-sm text-gray-500">
          Redirecting to your orders in {countdown} seconds...
        </div>
      </div>
    </div>
  );
}
