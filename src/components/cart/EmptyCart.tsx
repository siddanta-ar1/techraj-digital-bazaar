'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react'

export default function EmptyCart() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-100 rounded-full mb-6">
        <ShoppingBag className="h-12 w-12 text-indigo-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-3">Your cart is empty</h2>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        Looks like you haven't added any digital products to your cart yet. Explore our collection of gift cards, game top-ups, and subscriptions.
      </p>

      <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
        {[
          { title: 'Popular Games', desc: 'Top-up Fortnite, PUBG, Steam', color: 'bg-blue-50 text-blue-700' },
          { title: 'Gift Cards', desc: 'Amazon, iTunes, Google Play', color: 'bg-amber-50 text-amber-700' },
          { title: 'Subscriptions', desc: 'Spotify, Netflix, Discord', color: 'bg-purple-50 text-purple-700' },
        ].map((item, index) => (
          <div key={index} className={`p-4 rounded-lg ${item.color} flex flex-col items-center`}>
            <Sparkles className="h-6 w-6 mb-2" />
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Continue Shopping
        </Link>
        
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          View Featured Products
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="mt-12 pt-8 border-t">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Why shop with us?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { text: 'Instant Delivery', sub: 'Auto-delivery products' },
            { text: '24/7 Support', sub: 'WhatsApp & Phone' },
            { text: 'Secure Payment', sub: 'SSL Encrypted' },
            { text: 'Best Prices', sub: 'Price Match Guarantee' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold text-indigo-600">{item.text}</div>
              <div className="text-xs text-slate-500">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}