// src/app/api/wallet/transactions/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 60 requests/minute per user is generous for UI pagination; prevents DB hammering
    const rl = checkRateLimit(`txn:${user.id}`, 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)

    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const page = (!Number.isFinite(rawPage) || rawPage < 1) ? 1 : Math.min(rawPage, 1000);
    const limit = (!Number.isFinite(rawLimit) || rawLimit < 1) ? 20 : Math.min(rawLimit, 100);
    const offset = (page - 1) * limit;

    const ALLOWED_TYPES = new Set(['credit', 'debit']);
    const ALLOWED_TX_TYPES = new Set(['topup', 'purchase', 'admin_adjustment', 'refund']);
    const type = searchParams.get('type');
    const transactionType = searchParams.get('transactionType');

    if (type && !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
    if (transactionType && !ALLOWED_TX_TYPES.has(transactionType)) {
      return NextResponse.json({ error: 'Invalid transactionType parameter' }, { status: 400 });
    }

    let query = admin
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }

    const { data: transactions, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      transactions,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error: any) {
    console.error("[wallet/transactions] GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}