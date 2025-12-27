// src/app/api/wallet/topup/route.ts
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

    const { amount, paymentMethod, transactionId, screenshotUrl } = await request.json()

    // Validate input
    if (!amount || amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: 'Amount must be between Rs. 100 and Rs. 50,000' },
        { status: 400 }
      )
    }

    // Check if user has pending top-up requests
    const { data: pendingRequests } = await supabase
      .from('topup_requests')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .limit(1)

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json(
        { error: 'You have a pending top-up request. Please wait for it to be processed.' },
        { status: 400 }
      )
    }

    // Create top-up request
    const { data: topupRequest, error } = await supabase
      .from('topup_requests')
      .insert([{
        user_id: session.user.id,
        amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) throw error

    // Create pending wallet transaction
    await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: session.user.id,
        amount,
        type: 'credit',
        transaction_type: 'topup',
        reference_id: topupRequest.id,
        description: `Top-up request via ${paymentMethod}`,
        balance_after: 0, // Will be updated when approved
        status: 'pending'
      }])

    // TODO: Send notification to admin

    return NextResponse.json({
      success: true,
      topupRequest,
      message: 'Top-up request submitted successfully'
    })

  } catch (error: any) {
    console.error('Top-up request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create top-up request' },
      { status: 500 }
    )
  }
}

// GET all top-up requests for user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const { data: topupRequests, error } = await supabase
      .from('topup_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const { count } = await supabase
      .from('topup_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    return NextResponse.json({
      topupRequests,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch top-up requests' },
      { status: 500 }
    )
  }
}