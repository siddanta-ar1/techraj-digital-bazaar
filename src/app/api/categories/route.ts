import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    // Transform to include product count
    const categoriesWithCount = categories?.map(category => ({
      ...category,
      product_count: (category as any).products?.[0]?.count || 0
    }))

    return NextResponse.json({ categories: categoriesWithCount })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}