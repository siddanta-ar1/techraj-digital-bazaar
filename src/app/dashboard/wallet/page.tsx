// src/app/dashboard/wallet/page.tsx
import { Metadata } from 'next'
import { Wallet, TrendingUp, History, PlusCircle, Shield } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import WalletClient from './WalletClient'

export const metadata: Metadata = {
  title: 'Wallet - Tronline Bazar',
  description: 'Manage your wallet balance and transactions',
}

export default async function WalletPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Fetch user wallet balance
  const { data: user } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', session.user.id)
    .single()

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Wallet className="h-8 w-8 text-indigo-600" />
          My Wallet
        </h1>
        <p className="text-slate-600 mt-2">Manage your balance and transaction history</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Current Balance</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                Rs. {user?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <Wallet className="h-10 w-10 text-indigo-600 opacity-80" />
          </div>
          <Link
            href="/dashboard/wallet/topup"
            className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Add Funds
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Credit</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                Rs. 0.00
              </p>
              <p className="text-xs text-green-600 mt-1">+0.00 this month</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Spent</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                Rs. 0.00
              </p>
              <p className="text-xs text-blue-600 mt-1">All time purchases</p>
            </div>
            <Shield className="h-10 w-10 text-blue-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <WalletClient 
  initialBalance={user?.wallet_balance || 0} 
  initialTransactions={recentTransactions || []} 
/>
    </div>
  )
}