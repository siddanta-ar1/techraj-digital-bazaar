// src/app/api/orders/create/route.ts - UPDATED
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderData = await request.json()
    const { items, paymentMethod, totalAmount, deliveryDetails, paymentScreenshotUrl } = orderData

    // Generate unique order number using crypto
    const orderNumber = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const orderId = crypto.randomUUID()

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        id: orderId,
        order_number: orderNumber,
        user_id: session.user.id,
        total_amount: totalAmount,
        final_amount: totalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'wallet' ? 'paid' : 'pending',
        payment_screenshot_url: paymentScreenshotUrl,
        delivery_type: deliveryDetails?.type || 'auto',
        delivery_details: deliveryDetails
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      status: 'pending'
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Handle wallet payment
    if (paymentMethod === 'wallet') {
      // Check wallet balance
      const { data: user } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', session.user.id)
        .single()

      if (!user || (user.wallet_balance && user.wallet_balance < totalAmount)) {
        throw new Error('Insufficient wallet balance')
      }

      // Deduct from wallet
      const newBalance = user.wallet_balance - totalAmount
      const { error: walletError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: session.user.id,
          amount: totalAmount,
          type: 'debit',
          transaction_type: 'purchase',
          reference_id: orderId,
          description: `Order ${orderNumber}`,
          balance_after: newBalance,
          status: 'completed'
        }])

      if (walletError) throw walletError

      // Update user wallet balance
      await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', session.user.id)
    }

    // For non-wallet payments, create pending wallet transaction
    if (paymentMethod !== 'wallet') {
      const { error: pendingTransaction } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: session.user.id,
          amount: totalAmount,
          type: 'credit', // Pending credit until payment verified
          transaction_type: 'topup',
          reference_id: orderId,
          description: `Pending payment for order ${orderNumber}`,
          balance_after: 0,
          status: 'pending'
        }])

      if (pendingTransaction) throw pendingTransaction
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending'
    })

  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}