// src/app/dashboard/wallet/topup/page.tsx
import { Metadata } from 'next'
import { Upload, CreditCard, Building, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TopupForm from './TopupForm'

export const metadata: Metadata = {
  title: 'Add Funds - Tronline Bazar',
  description: 'Top up your wallet balance',
}

export default async function TopupPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add Funds</h1>
            <p className="text-slate-600 mt-2">Top up your wallet balance securely</p>
          </div>
          <Link
            href="/dashboard/wallet"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Wallet
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Payment Method</h2>
            
            <TopupForm />
          </div>

          {/* Processing Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Processing Information</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Esewa payments: Usually processed within 5-10 minutes</li>
                  <li>• Bank transfers: Require screenshot verification (1-2 hours)</li>
                  <li>• All payments are manually verified for security</li>
                  <li>• You'll receive email notification when funds are added</li>
                  <li>• Minimum top-up amount: Rs. 100</li>
                  <li>• Maximum top-up amount: Rs. 50,000 per day</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Instructions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Esewa Instructions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Esewa Payment</h3>
            </div>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Enter amount and select "Esewa"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>You'll be redirected to Esewa payment page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Complete payment using Esewa ID/Mobile Banking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>Return to site for automatic verification</span>
              </li>
            </ol>
          </div>

          {/* Bank Transfer Instructions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Bank Transfer</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-2">Account Details:</p>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>Bank: Nepal Investment Mega Bank</p>
                  <p>Account Name: Techraj Digital Bazar</p>
                  <p>Account Number: 12345678901234</p>
                  <p>Reference: Your Email/Username</p>
                </div>
              </div>
              <ol className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">1.</span>
                  <span>Transfer amount to above account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">2.</span>
                  <span>Take screenshot of successful transfer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">3.</span>
                  <span>Upload screenshot in the form</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">4.</span>
                  <span>Admin will verify and add funds</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Upload Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Screenshot Tips
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Ensure screenshot shows transaction ID</li>
              <li>• Include date, time, and amount in screenshot</li>
              <li>• Clear, readable screenshots process faster</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Supported formats: JPG, PNG, PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}