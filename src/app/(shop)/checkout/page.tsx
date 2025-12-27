// src/app/(shop)/checkout/page.tsx
import { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'

import { Suspense } from 'react'
import CheckoutLoadingSkeleton from './CheckoutLoadingSkeleton'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
  title: 'Checkout - Tronline Bazar',
  description: 'Complete your purchase securely',
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Secure Checkout</h1>
          <p className="text-slate-600 mt-2">Complete your purchase in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 -z-10"></div>
            {['Cart', 'Delivery', 'Payment', 'Confirm'].map((step, index) => (
              <div key={step} className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-2
                  ${index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {index + 1}
                </div>
                <span className={`text-sm font-medium ${index === 0 ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Suspense fallback={<CheckoutLoadingSkeleton />}>
          <CheckoutClient />
        </Suspense>
      </div>
    </div>
  )
}