import { ProductGrid } from '@/components/products/ProductGrid'
import { createClient } from '@/lib/supabase/server'
import { CategoryFilter } from '@/components/products/CategoryFilter'

export default async function ProductsPage() {
  const supabase = await createClient()
  
  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Fetch featured products for hero
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(4)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Digital Products Store
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl">
            Browse our collection of game codes, gift cards, and digital services. Instant delivery guaranteed.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with Categories */}
          <div className="lg:w-1/4">
            <div className="sticky top-24">
              <CategoryFilter categories={categories || []} />
              
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 mt-6">
                <h3 className="font-bold text-slate-900 mb-4">Why Choose Us</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Instant Delivery
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    24/7 Support
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Secure Payments
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Money Back Guarantee
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <ProductGrid showFilters={true} />
          </div>
        </div>
      </div>
    </div>
  )
}