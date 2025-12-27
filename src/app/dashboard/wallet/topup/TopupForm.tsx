// src/app/dashboard/wallet/topup/TopupForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

type PaymentMethod = 'esewa' | 'bank_transfer'

export default function TopupForm() {
  const router = useRouter()
  const supabase = createClient()

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('esewa')
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [userBalance, setUserBalance] = useState(0)

  useEffect(() => {
    fetchUserBalance()
  }, [])

  const fetchUserBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: user } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', session.user.id)
        .single()
      setUserBalance(user?.wallet_balance || 0)
    }
  }

  const handleAmountClick = (value: string) => {
    setAmount(value)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!amount || parseFloat(amount) < 100) {
      newErrors.amount = 'Minimum amount is Rs. 100'
    } else if (parseFloat(amount) > 50000) {
      newErrors.amount = 'Maximum amount is Rs. 50,000 per day'
    }

    if (paymentMethod === 'bank_transfer') {
      if (!screenshot) {
        newErrors.screenshot = 'Screenshot is required for bank transfer'
      } else if (screenshot.size > 5 * 1024 * 1024) {
        newErrors.screenshot = 'File size must be less than 5MB'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      // Upload screenshot if provided
      let screenshotUrl = ''
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop()
        const fileName = `${Date.now()}-topup-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, screenshot)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(fileName)

        screenshotUrl = publicUrl
      }

      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User not authenticated')
      }

      // Create top-up request
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          transactionId: transactionId || `TR-${Date.now()}`,
          screenshotUrl
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create top-up request')
      }

      setSuccessMessage('Top-up request submitted successfully! Admin will review it shortly.')
      
      // Reset form
      setTimeout(() => {
        setAmount('')
        setTransactionId('')
        setScreenshot(null)
        setSuccessMessage('')
        router.push('/dashboard/wallet')
      }, 3000)

    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Amount (NPR) *
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
          {['100', '500', '1000', '2000', '5000'].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => handleAmountClick(value)}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                amount === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Rs. {value}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter custom amount"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          min="100"
          max="50000"
          step="100"
        />
        {errors.amount && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errors.amount}
          </p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          Current Balance: Rs. {userBalance.toFixed(2)}
        </p>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Payment Method *
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('esewa')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === 'esewa'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                paymentMethod === 'esewa' ? 'bg-indigo-100' : 'bg-slate-100'
              }`}>
                <div className="h-6 w-6 bg-blue-500 rounded"></div>
              </div>
              <div>
                <div className="font-medium text-slate-900">Esewa</div>
                <div className="text-sm text-slate-600">Instant payment</div>
              </div>
              {paymentMethod === 'esewa' && (
                <CheckCircle2 className="h-6 w-6 text-green-500 ml-auto" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === 'bank_transfer'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                paymentMethod === 'bank_transfer' ? 'bg-indigo-100' : 'bg-slate-100'
              }`}>
                <div className="h-6 w-6 bg-purple-500 rounded"></div>
              </div>
              <div>
                <div className="font-medium text-slate-900">Bank Transfer</div>
                <div className="text-sm text-slate-600">Upload screenshot</div>
              </div>
              {paymentMethod === 'bank_transfer' && (
                <CheckCircle2 className="h-6 w-6 text-green-500 ml-auto" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Transaction ID (Optional) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Transaction ID (Optional)
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter transaction ID from payment"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="mt-2 text-sm text-slate-500">
          Optional: Enter transaction ID from Esewa or bank for faster processing
        </p>
      </div>

      {/* Screenshot Upload */}
      {paymentMethod === 'bank_transfer' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Payment Screenshot *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            {screenshot ? (
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{screenshot.name}</p>
                    <p className="text-sm text-slate-500">
                      {(screenshot.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 mb-2">Drag & drop or click to upload</p>
                <p className="text-sm text-slate-500 mb-4">
                  Screenshot of successful bank transfer
                </p>
                <label className="cursor-pointer inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                  Choose File
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
          {errors.screenshot && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.screenshot}
            </p>
          )}
        </div>
      )}

      {/* Terms */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
        <input
          type="checkbox"
          id="terms"
          required
          className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="terms" className="text-sm text-slate-700">
          I confirm that I have completed the payment and the details provided are accurate.
          I understand that false information may result in account suspension.
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
          isSubmitting
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          `Request Top-up (Rs. ${amount || '0.00'})`
        )}
      </button>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {successMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {errors.submit}
          </p>
        </div>
      )}

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-slate-600">
          Need help? Contact support: +977 9846908072 (WhatsApp)
        </p>
      </div>
    </form>
  )
}