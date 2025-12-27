// src/app/admin/orders/page.tsx
import { Metadata } from 'next'
import { ShoppingBag, Filter, Download, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminOrdersClient from './AdminOrdersClient'

export const metadata: Metadata = {
  title: 'Order Management - Admin Panel',
  description: 'Manage and process customer orders',
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (user?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch orders for admin
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(full_name, email, phone),
      order_items(
        *,
        variant:product_variants(
          variant_name,
          product:products(name)
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-indigo-600" />
              Order Management
            </h1>
            <p className="text-slate-600 mt-2">Manage and process customer orders</p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders?.length || 0, color: 'bg-blue-500' },
          { label: 'Pending', value: orders?.filter(o => o.status === 'pending').length || 0, color: 'bg-amber-500' },
          { label: 'Processing', value: orders?.filter(o => o.status === 'processing').length || 0, color: 'bg-purple-500' },
          { label: 'Completed', value: orders?.filter(o => o.status === 'completed').length || 0, color: 'bg-green-500' },
          { label: 'Revenue', value: `Rs. ${orders?.reduce((sum, o) => sum + o.final_amount, 0).toFixed(2) || '0.00'}`, color: 'bg-indigo-500' },
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

      {/* Orders Table */}
      <AdminOrdersClient initialOrders={orders || []} />
    </div>
  )
}