import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/components/products/ProductDetail'
import { RelatedProducts } from '@/components/products/RelatedProducts'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { DeliveryInfo } from '@/components/products/DeliveryInfo'
import { TrustBadges } from '@/components/products/TrustBadges'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) return {
    title: 'Product Not Found - Techraj Digital Bazar',
    description: 'Product not found'
  }

  return {
    title: `${product.name} - Techraj Digital Bazar`,
    description: product.description?.substring(0, 160) || 'Digital product from Techraj Digital Bazar',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Fetch product with all details
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !product) {
    console.error('Product fetch error:', error)
    notFound()
  }

  // Get reviews count separately
  const { count: reviewsCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', product.id)
    .eq('is_approved', true)

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4)

  // Add reviews count to product
  const productWithReviews = {
    ...product,
    reviews: [{ count: reviewsCount || 0 }]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb 
            category={product.category}
            product={product}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Product Section */}
        <div className="mb-16">
          <ProductDetail product={productWithReviews} />
        </div>

        {/* Delivery & Trust Info */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DeliveryInfo product={product} />
            </div>
            <div>
              <TrustBadges />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                🔥 Related Products
              </h2>
              <p className="text-slate-600">
                Other products you might like
              </p>
            </div>
            <RelatedProducts products={relatedProducts} />
          </div>
        )}

        {/* Product Description Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  )
}

// ProductTabs component moved here
function ProductTabs({ product }: { product: any }) {
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Description</h3>
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {product.description || 'No description available.'}
        </p>
        
        {product.delivery_instructions && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Delivery Instructions:</h4>
            <p className="text-blue-700">{product.delivery_instructions}</p>
          </div>
        )}
      </div>
    </div>
  )
}