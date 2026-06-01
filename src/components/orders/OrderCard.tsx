'use client'

import Link from 'next/link'
import {
  Package, CreditCard, Truck, CheckCircle, Clock,
  XCircle, AlertCircle, Eye, Zap,
} from 'lucide-react'
import { format } from 'date-fns'

interface OrderItem {
  id: string
  variant: { variant_name: string; product: { name: string } }
  quantity: number
  unit_price: number
  total_price: number
  status: string
  delivered_code?: string
  option_selections?: any
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

const STATUS_CONFIG = {
  completed:  { icon: CheckCircle, pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  processing: { icon: Package,     pill: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500'   },
  pending:    { icon: Clock,       pill: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-500'  },
  cancelled:  { icon: XCircle,     pill: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500'    },
  refunded:   { icon: AlertCircle, pill: 'bg-slate-50 text-slate-600 border-slate-200',        dot: 'bg-slate-400'  },
} as const

const PAYMENT_LABEL: Record<string, string> = {
  wallet: 'Wallet',
  esewa: 'eSewa',
  bank_transfer: 'Bank Transfer',
}

export default function OrderCard({ order }: { order: Order }) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.refunded
  const StatusIcon = cfg.icon
  const itemCount = order.order_items.reduce((s, i) => s + i.quantity, 0)
  const hasDelivered = order.order_items.some((i) => i.delivered_code)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.pill}`}>
            <StatusIcon className="w-3 h-3" />
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
            order.payment_status === 'paid'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {order.payment_status.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:block">
          {format(new Date(order.created_at), 'MMM d, yyyy · h:mm a')}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          {/* Order number + item count */}
          <div className="flex items-baseline gap-2.5 mb-2">
            <h3 className="font-bold text-slate-900">#{order.order_number}</h3>
            <span className="text-sm text-slate-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              {PAYMENT_LABEL[order.payment_method] ?? order.payment_method}
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              {order.delivery_type === 'auto'
                ? <><Zap className="w-3.5 h-3.5 text-indigo-500" />Auto</>
                : <><Truck className="w-3.5 h-3.5" />Manual</>}
            </span>
            {hasDelivered && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />Delivered
                </span>
              </>
            )}
            <span className="text-slate-300 sm:hidden">·</span>
            <span className="text-slate-400 sm:hidden">
              {format(new Date(order.created_at), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Item chips */}
          <div className="flex flex-wrap gap-1.5">
            {order.order_items.slice(0, 3).map((item) => {
              let parsedSelections: Record<string, any> = {}
              try {
                parsedSelections = typeof item.option_selections === 'string'
                  ? JSON.parse(item.option_selections)
                  : (item.option_selections || {})
              } catch { /* ignore */ }
              const optionText = Object.entries(parsedSelections)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join(' · ')
              return (
                <span
                  key={item.id}
                  className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg max-w-[200px] truncate"
                  title={optionText ? `${item.variant.product.name} · ${optionText}` : item.variant.product.name}
                >
                  {item.variant.product.name} × {item.quantity}
                </span>
              )
            })}
            {order.order_items.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-1 bg-slate-200 text-slate-500 text-xs font-medium rounded-lg">
                +{order.order_items.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Amount + action */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-slate-900">Rs. {order.final_amount.toFixed(2)}</p>
          </div>
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            View Order
          </Link>
        </div>
      </div>
    </div>
  )
}
