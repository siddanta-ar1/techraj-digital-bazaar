'use client'

import { useState } from 'react'
import { BookOpen, HelpCircle, MessageSquare, FileText } from 'lucide-react'

interface ProductTabsProps {
  product: {
    description: string
    delivery_instructions?: string
  }
}

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState('description')

  const tabs = [
    { id: 'description', label: 'Description', icon: <FileText className="w-4 h-4" /> },
    { id: 'guide', label: 'How to Use', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquare className="w-4 h-4" /> },
  ]

  const content = {
    description: (
      <div className="prose prose-slate max-w-none">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Product Details</h3>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {product.description}
        </p>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Features:</h4>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Instant digital delivery
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                100% working codes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                24/7 customer support
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Requirements:</h4>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Active game account
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Valid email address
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
    
    guide: (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">How to Redeem Your Code</h3>
        
        <div className="space-y-4">
          {[
            { step: 1, title: 'Complete Purchase', desc: 'Add to cart and complete payment via your preferred method' },
            { step: 2, title: 'Receive Code', desc: 'Check your email inbox for the digital code (also available in order history)' },
            { step: 3, title: 'Redeem in Game', desc: 'Log into your game account and enter the code in the redemption section' },
            { step: 4, title: 'Enjoy!', desc: 'Your in-game currency or item will be added immediately' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {step}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
                <p className="text-slate-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    
    faq: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
        
        {[
          { q: 'How long does delivery take?', a: 'Most codes are delivered within 5 minutes of payment confirmation. Manual delivery products may take up to 6 hours.' },
          { q: 'What if my code doesn\'t work?', a: 'Contact our support immediately with your order number. We provide a full refund or replacement within 24 hours.' },
          { q: 'Can I get a refund?', a: 'Yes, we offer a full money-back guarantee if the code doesn\'t work or if there are any issues with delivery.' },
          { q: 'Is this safe and legal?', a: 'Yes, we are an authorized distributor of digital game codes. All transactions are secure and legitimate.' },
        ].map(({ q, a }, index) => (
          <div key={index} className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">{q}</h4>
            <p className="text-slate-600">{a}</p>
          </div>
        ))}
      </div>
    ),
    
    reviews: (
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Customer Reviews</h3>
        <p className="text-slate-600">Reviews will appear here once customers start rating this product.</p>
      </div>
    ),
  }

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap
              ${activeTab === tab.id 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-slate-600 hover:text-slate-900'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 md:p-8">
        {content[activeTab as keyof typeof content]}
      </div>
    </div>
  )
}