import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ProductFilters } from '@/types/product'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()

    // Parse query parameters
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const featured = searchParams.get('featured')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    // Start building the query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `, { count: 'exact' })
      .eq('is_active', true)
      .range(offset, offset + limit - 1)

    // Apply filters
    if (category) {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { foreignTable: 'product_variants', ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { foreignTable: 'product_variants', ascending: false })
        break
      case 'popular':
        query = query.order('created_at', { ascending: false }) // TODO: Add popularity field
        break
      default: // newest
        query = query.order('created_at', { ascending: false })
    }

    const { data: products, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Filter by price range if specified
    let filteredProducts = products
    if (minPrice || maxPrice) {
      filteredProducts = products.filter(product => {
        const variantPrices = product.variants?.map(v => v.price) || [0]
        const minVariantPrice = Math.min(...variantPrices)
        return (!minPrice || minVariantPrice >= parseFloat(minPrice)) &&
               (!maxPrice || minVariantPrice <= parseFloat(maxPrice))
      })
    }

    return NextResponse.json({
      products: filteredProducts,
      total: count || filteredProducts.length,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// Create product (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const productData = await request.json()
    
    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}