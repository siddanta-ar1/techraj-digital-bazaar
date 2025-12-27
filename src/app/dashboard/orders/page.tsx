// src/app/dashboard/orders/page.tsx
import { Metadata } from 'next'
import { ShoppingBag, Filter, Download, Search } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

export const metadata: Metadata = {
  title: 'My Orders - Tronline Bazar',
  description: 'View your order history and track deliveries',
}

export default async function OrdersPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Fetch user's orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        variant:product_variants(
          variant_name,
          product:products(name)
        )
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-indigo-600" />
          My Orders
        </h1>
        <p className="text-slate-600 mt-2">Track and manage your orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders?.length || 0, color: 'bg-blue-500' },
          { label: 'Pending', value: orders?.filter(o => o.status === 'pending').length || 0, color: 'bg-amber-500' },
          { label: 'Completed', value: orders?.filter(o => o.status === 'completed').length || 0, color: 'bg-green-500' },
          { label: 'Total Spent', value: `Rs. ${orders?.reduce((sum, o) => sum + o.final_amount, 0).toFixed(2) || '0.00'}`, color: 'bg-purple-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className={`h-10 w-10 ${stat.color} rounded-full opacity-20`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders List */}
      <OrdersClient initialOrders={orders || []} />
    </div>
  )
}