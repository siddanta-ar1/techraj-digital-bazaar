// src/components/orders/OrderCard.tsx
'use client'

import Link from 'next/link'
import { Package, CreditCard, Truck, CheckCircle, Clock, XCircle, AlertCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface OrderItem {
  id: string
  variant: {
    variant_name: string
    product: {
      name: string
    }
  }
  quantity: number
  unit_price: number
  total_price: number
  status: string
  delivered_code?: string
}

interface Order {
  id: string
  order_number: string
  total_amount: number
  final_amount: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  payment_method: 'wallet' | 'esewa' | 'bank_transfer'
  payment_status: 'pending' | 'paid' | 'failed'
  delivery_type: 'auto' | 'manual'
  created_at: string
  order_items: OrderItem[]
}

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  const getStatusIcon = () => {
    switch (order.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'processing':
        return <Package className="h-5 w-5 text-blue-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-slate-600" />
    }
  }

  const getStatusColor = () => {
    switch (order.status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getPaymentIcon = () => {
    switch (order.payment_method) {
      case 'wallet': return <CreditCard className="h-4 w-4" />
      case 'esewa': return <div className="h-4 w-4 bg-blue-500 rounded"></div>
      case 'bank_transfer': return <div className="h-4 w-4 bg-purple-500 rounded"></div>
      default: return null
    }
  }

  const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0)
  const hasDeliveredItems = order.order_items.some(item => item.delivered_code)

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Order Info */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getPaymentIcon()}
              <span className="text-sm text-slate-600">
                {order.payment_method === 'wallet' ? 'Wallet' : 
                 order.payment_method === 'esewa' ? 'Esewa' : 'Bank Transfer'}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                order.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {order.payment_status}
              </span>
            </div>
          </div>

          <h3 className="font-semibold text-slate-900 mb-2">
            Order #{order.order_number}
          </h3>
          
          <div className="text-sm text-slate-600 space-y-1">
            <p>Placed on {format(new Date(order.created_at), 'MMM dd, yyyy h:mm a')}</p>
            <p>{itemCount} item{itemCount !== 1 ? 's' : ''} • Total: Rs. {order.final_amount.toFixed(2)}</p>
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {order.delivery_type === 'auto' ? 'Auto Delivery' : 'Manual Delivery'}
              {hasDeliveredItems && (
                <span className="text-green-600 font-medium">• Some items delivered</span>
              )}
            </p>
          </div>

          {/* Items Preview */}
          <div className="mt-4 flex flex-wrap gap-2">
            {order.order_items.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="px-3 py-1 bg-slate-100 rounded text-sm text-slate-700"
              >
                {item.variant.product.name} × {item.quantity}
              </div>
            ))}
            {order.order_items.length > 3 && (
              <div className="px-3 py-1 bg-slate-200 rounded text-sm text-slate-600">
                +{order.order_items.length - 3} more
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>
          
          {order.status === 'pending' && order.payment_method === 'bank_transfer' && (
            <button className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg font-medium border border-slate-300 hover:bg-slate-50 transition-colors">
              Upload Payment
            </button>
          )}
          
          {order.status === 'completed' && (
            <button className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg font-medium border border-green-300 hover:bg-green-50 transition-colors">
              Download Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  )
}