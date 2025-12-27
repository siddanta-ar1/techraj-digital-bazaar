import { Metadata } from 'next'
import { CheckCircle2, Package, MessageSquare, Download, Home, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Order Confirmed - Tronline Bazar',
  description: 'Your order has been successfully placed',
}

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const orderId = searchParams.orderId || 'TR-' + Date.now()

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Order Confirmed!</h1>
          <p className="text-lg text-slate-600">
            Thank you for your purchase. Your order #{orderId} has been received.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                What's Next?
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>You'll receive an email confirmation shortly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>For auto-delivery products, check your email inbox</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Manual delivery products will be processed within 1-2 hours</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Need Help?
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">WhatsApp Support</div>
                    <div className="text-sm text-slate-500">+977 9846908072</div>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Order Status</div>
                    <div className="text-sm text-slate-500">Track in your dashboard</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Order Actions */}
          <div className="mt-8 pt-8 border-t grid sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/orders"
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              View My Orders
            </Link>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Home className="h-5 w-5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Important Information</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Delivery Time',
                desc: 'Auto-delivery: Instant\nManual delivery: 1-2 hours',
                icon: Package,
                color: 'text-blue-600',
                bg: 'bg-blue-50'
              },
              {
                title: 'Payment Status',
                desc: 'Wallet: Instant\nEsewa/Bank: Verify screenshot',
                icon: CheckCircle2,
                color: 'text-green-600',
                bg: 'bg-green-50'
              },
              {
                title: 'Support',
                desc: '24/7 WhatsApp support\nEmail: support@tronlinebazar.com',
                icon: MessageSquare,
                color: 'text-purple-600',
                bg: 'bg-purple-50'
              }
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-xl border">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${item.bg} ${item.color} rounded-full mb-4`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Download Invoice Button */}
        <div className="mt-8 text-center">
          <button className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
            <Download className="h-5 w-5" />
            Download Invoice (Available in 5 minutes)
          </button>
        </div>
      </div>
    </div>
  )
}