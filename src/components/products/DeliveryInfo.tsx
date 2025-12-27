import { Truck, Package, Headphones, RotateCcw } from 'lucide-react'

interface DeliveryInfoProps {
  product?: {
    requires_manual_delivery?: boolean
    delivery_instructions?: string
  }
}

export function DeliveryInfo({ product }: DeliveryInfoProps) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Truck className="w-5 h-5 text-indigo-600" />
        Delivery Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instant Delivery */}
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Instant Delivery</h4>
            <p className="text-sm text-slate-600">
              Code delivered via email within 5 minutes of payment confirmation
            </p>
          </div>
        </div>

        {/* 24/7 Support */}
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Headphones className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">24/7 Support</h4>
            <p className="text-sm text-slate-600">
              Contact us anytime via WhatsApp, phone, or email
            </p>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <RotateCcw className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Money Back Guarantee</h4>
            <p className="text-sm text-slate-600">
              Full refund if code doesn't work within 24 hours
            </p>
          </div>
        </div>

        {/* Manual Delivery Notice */}
        {product?.requires_manual_delivery && (
          <div className="flex gap-3 md:col-span-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <div className="text-blue-600 font-bold text-lg">!</div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Manual Delivery Required</h4>
              <p className="text-sm text-slate-600">
                {product.delivery_instructions || 'This product requires manual processing. Delivery may take up to 6 hours.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Timeline */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-4">Delivery Timeline:</h4>
        <div className="relative">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium">Order Placed</p>
              <p className="text-slate-500">Immediate</p>
            </div>
            <div className="flex-1 h-0.5 bg-slate-300"></div>
            <div className="text-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium">Payment Confirmed</p>
              <p className="text-slate-500">1-2 minutes</p>
            </div>
            <div className="flex-1 h-0.5 bg-slate-300"></div>
            <div className="text-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium">Code Delivered</p>
              <p className="text-slate-500">Within 5 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}