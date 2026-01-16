import { Metadata } from "next";
import {
  CheckCircle2,
  Package,
  MessageSquare,
  Download,
  Home,
  ShoppingBag,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order Confirmed - Tronline Bazar",
  description: "Your order has been successfully placed",
};

// FIX: searchParams is now a Promise in Next.js 15+
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  // FIX: Await the searchParams before using properties
  const { orderId: paramOrderId } = await searchParams;

  // Use the resolved param or fallback
  const orderId = paramOrderId || "TR-" + Date.now();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6 shadow-sm ring-4 ring-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            Thank you for your purchase. Your order{" "}
            <span className="font-mono font-bold text-slate-800">
              #{orderId}
            </span>{" "}
            has been received.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* What's Next Section */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                What's Next?
              </h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 ring-4 ring-indigo-50"></div>
                    <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Order Confirmation
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      We've sent a confirmation email with invoice.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-slate-300 rounded-full mt-2"></div>
                    <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Processing</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Auto-delivery items are sent instantly. Manual items take
                      1-2 hours.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-slate-300 rounded-full mt-2"></div>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Completion</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      You'll be notified once delivery is complete.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div className="p-8 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                Need Help?
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        WhatsApp Support
                      </div>
                      <div className="text-sm text-slate-500">
                        +977 9846908072
                      </div>
                    </div>
                    <a
                      href="https://wa.me/9779846908072"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                    >
                      Chat Now
                    </a>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        Track Order
                      </div>
                      <div className="text-sm text-slate-500">
                        Check status in dashboard
                      </div>
                    </div>
                    <Link
                      href="/dashboard/orders"
                      className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      Track
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" />
              View My Order
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-bold border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              Return to Home
            </Link>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <InfoCard
            icon={Clock}
            color="text-amber-600"
            bg="bg-amber-50"
            title="Delivery Time"
            desc="Auto-delivery is instant. Manual verification takes 1-2 hours max."
          />
          <InfoCard
            icon={ShieldCheck}
            color="text-emerald-600"
            bg="bg-emerald-50"
            title="Secure Transaction"
            desc="Your payment is secured. Screenshots are verified manually by staff."
          />
          <InfoCard
            icon={Download}
            color="text-indigo-600"
            bg="bg-indigo-50"
            title="Invoice"
            desc="A digital invoice has been sent to your registered email address."
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, color, bg, title, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center hover:shadow-md transition-shadow">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 ${bg} ${color} rounded-xl mb-4`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="font-bold text-slate-900 mb-2">{title}</h4>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
