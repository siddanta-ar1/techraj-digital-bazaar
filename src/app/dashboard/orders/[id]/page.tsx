// src/app/dashboard/orders/[id]/page.tsx
import { Metadata } from 'next'
import { ArrowLeft, Package, CreditCard, User, Phone, Mail, Download, Printer } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrderDetailsClient from './OrderDetailsClient'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  return {
    title: `Order Details - Tronline Bazar`,
    description: 'View order details and delivery information',
  }
}

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Fetch order details
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        variant:product_variants(
          variant_name,
          product:products(name, featured_image)
        )
      ),
      user:users(full_name, email, phone)
    `)
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!order) {
    redirect('/dashboard/orders')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">
              Order #{order.order_number}
            </h1>
            <p className="text-slate-600 mt-2">
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Download className="h-4 w-4" />
              Invoice
            </button>
          </div>
        </div>
      </div>

      <OrderDetailsClient order={order} />
    </div>
  )
}