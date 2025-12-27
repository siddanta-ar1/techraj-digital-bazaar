import { createClient } from '@/lib/supabase/server' // <--- FIXED IMPORT
import { ProductGrid } from '@/components/products/ProductGrid'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default async function HomePage() {
  // 1. Initialize the Supabase client for this request
  const supabase = await createClient()

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      variants:product_variants(*)
    `)
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  // Fetch new arrivals
  const { data: newArrivals } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      variants:product_variants(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)

  // Fetch categories for quick navigation
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(8)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Minimal Hero Section */}
      {/* <section className="relative bg-gradient-to-br from-slate-900 to-indigo-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Instant Digital Products
              <span className="block text-3xl md:text-4xl text-indigo-300 mt-2">
                Top-ups, Gift Cards & More
              </span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Get instant delivery on PUBG UC, Freefire Diamonds, Netflix, Gift Cards, and 100+ digital products
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/products" 
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                Browse All Products <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="#featured" 
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors border border-white/20"
              >
                View Featured
              </Link>
            </div>
          </div>
        </div>
      </section> */}

      {/* Quick Categories Navigation */}
      {/* {categories && categories.length > 0 && (
        <section className="py-8 bg-slate-50 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Shop by Category</h2>
              <Link 
                href="/categories" 
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="flex-shrink-0 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <span className="font-medium text-slate-700">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )} */}

      {/* Featured Products */}
      <section id="featured" className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">🔥 Featured Products</h2>
              <p className="text-slate-600 mt-2">Most popular and best selling items</p>
            </div>
            <Link 
              href="/products?sort=featured" 
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <ProductGrid initialProducts={featuredProducts} featured={true} showFilters={false} />
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">🆕 New Arrivals</h2>
              <p className="text-slate-600 mt-2">Recently added to our store</p>
            </div>
            <Link 
              href="/products?sort=newest" 
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {newArrivals && newArrivals.length > 0 ? (
            <ProductGrid initialProducts={newArrivals} showFilters={false} />
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No new arrivals</p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      {/* <section className="py-12 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Instant Delivery</h3>
              <p className="text-slate-600">Digital products delivered instantly via email</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
              <p className="text-slate-600">100% secure transactions</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="font-bold text-lg mb-2">24/7 Support</h3>
              <p className="text-slate-600">Round-the-clock customer support</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* Final CTA */}
      {/* <section className="py-12 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Join thousands of satisfied customers. Create your account today!
          </p>
          <Link 
            href="/register" 
            className="inline-block bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Account
          </Link>
        </div>
      </section> */}
    </div>
  )
}