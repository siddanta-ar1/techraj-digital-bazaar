import { HeroBanner } from '@/components/home/HeroBanner'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { ProductGrid } from '@/components/products/ProductGrid'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner/Slider */}
      <HeroBanner />
      
      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">🔥 Featured Products</h2>
            <p className="text-gray-600">Best selling digital products with instant delivery</p>
          </div>
          <FeaturedProducts />
        </div>
      </section>
      
      {/* Product Grid/Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">🛍️ All Products</h2>
            <p className="text-gray-600">Browse our complete collection of digital products</p>
          </div>
          <ProductGrid />
        </div>
      </section>
    </div>
  )
}