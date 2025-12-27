'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { 
  CreditCard, 
  Wallet, 
  Building, 
  Upload, 
  AlertCircle,
  Shield,
  CheckCircle2
} from 'lucide-react'
import OrderSummary from '@/components/checkout/OrderSummary'

type PaymentMethod = 'wallet' | 'esewa' | 'bank_transfer'

interface DeliveryDetails {
  deliveryMethod: 'auto' | 'manual'
  contactEmail: string
  contactPhone: string
  additionalNotes?: string
}

export default function CheckoutClient() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const supabase = createClient()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet')
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    deliveryMethod: 'auto',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    additionalNotes: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPaymentScreenshot, setShowPaymentScreenshot] = useState(false)
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!deliveryDetails.contactEmail) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(deliveryDetails.contactEmail)) {
      newErrors.email = 'Email is invalid'
    }

    if (!deliveryDetails.contactPhone) {
      newErrors.phone = 'Phone number is required'
    }

    if (paymentMethod === 'bank_transfer' && !paymentScreenshot) {
      newErrors.screenshot = 'Payment screenshot is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsProcessing(true)

    try {
      // Upload payment screenshot if provided
      let screenshotUrl = ''
      if (paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, paymentScreenshot)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(fileName)

        screenshotUrl = publicUrl
      }

      // Create order
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          price: item.price,
          quantity: item.quantity
        })),
        paymentMethod,
        totalAmount: totalPrice,
        deliveryDetails: {
          type: deliveryDetails.deliveryMethod,
          contactEmail: deliveryDetails.contactEmail,
          contactPhone: deliveryDetails.contactPhone,
          additionalNotes: deliveryDetails.additionalNotes
        },
        paymentScreenshotUrl: screenshotUrl
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order')
      }

      // Clear cart and redirect to success page
      clearCart()
      router.push(`/checkout/success?orderId=${result.orderId}`)

    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Delivery & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Delivery Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={deliveryDetails.contactEmail}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={deliveryDetails.contactPhone}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="+977 9846908072"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={deliveryDetails.additionalNotes}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Delivery Information</p>
                    <p className="text-sm text-blue-700 mt-1">
                      • Auto-delivery products will be delivered instantly via email<br/>
                      • Manual delivery products require admin verification (usually within 1-2 hours)<br/>
                      • You will receive updates via WhatsApp and email
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h3>
            <div className="space-y-4">
              {/* Wallet Option */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'}`}
                onClick={() => setPaymentMethod('wallet')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${paymentMethod === 'wallet' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <Wallet className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Wallet Balance</div>
                      <div className="text-sm text-slate-600">
                        Available: Rs. {user?.wallet_balance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                  {paymentMethod === 'wallet' && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>
                {paymentMethod === 'wallet' && user && user.wallet_balance && user.wallet_balance < totalPrice && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Insufficient wallet balance. Please top up your wallet or choose another payment method.
                    </p>
                  </div>
                )}
              </div>

              {/* Esewa Option */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'esewa' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'}`}
                onClick={() => setPaymentMethod('esewa')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${paymentMethod === 'esewa' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Esewa</div>
                      <div className="text-sm text-slate-600">Pay via Esewa wallet or bank</div>
                    </div>
                  </div>
                  {paymentMethod === 'esewa' && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </div>

              {/* Bank Transfer Option */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'}`}
                onClick={() => {
                  setPaymentMethod('bank_transfer')
                  setShowPaymentScreenshot(true)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${paymentMethod === 'bank_transfer' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Bank Transfer</div>
                      <div className="text-sm text-slate-600">Upload payment screenshot after transfer</div>
                    </div>
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Payment Screenshot Upload */}
            {showPaymentScreenshot && (
              <div className="mt-6 p-4 border border-slate-300 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  <Upload className="h-4 w-4 inline mr-2" />
                  Upload Payment Screenshot *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {errors.screenshot && (
                  <p className="mt-2 text-sm text-red-600">{errors.screenshot}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Upload clear screenshot of bank transfer or Esewa payment
                </p>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900">Security & Privacy</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>✓ Your payment information is encrypted and secure</p>
              <p>✓ We never store your bank card details</p>
              <p>✓ All transactions are protected by SSL encryption</p>
              <p>✓ 24/7 fraud monitoring and prevention</p>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary />
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || (paymentMethod === 'wallet' && user && user.wallet_balance && user.wallet_balance < totalPrice)}
            className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2
              ${isProcessing || (paymentMethod === 'wallet' && user && user.wallet_balance && user.wallet_balance < totalPrice)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Order...
              </>
            ) : (
              `Complete Purchase (Rs. ${totalPrice.toFixed(2)})`
            )}
          </button>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="mt-6 text-xs text-slate-500">
            <p>
              By completing your purchase, you agree to our{' '}
              <a href="/terms" className="text-indigo-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a>.
            </p>
            <p className="mt-2">
              Need help? Contact us via WhatsApp: +977 9846908072
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}