import { createAdminClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/products/ProductGrid";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Headphones } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Techraj Digital Shop – Buy Digital Products in Nepal",
  },
  description:
    "Techraj Digital Shop (techrajshop.com) – Nepal's trusted marketplace for PUBG UC, Freefire Diamonds, Netflix, Steam Gift Cards and 100+ instant digital products.",
  alternates: { canonical: "https://techrajshop.com" },
  openGraph: {
    title: "Techraj Digital Shop – Buy Digital Products in Nepal",
    description:
      "Nepal's trusted marketplace for PUBG UC, Freefire Diamonds, Netflix, Steam Gift Cards and 100+ instant digital products.",
    url: "https://techrajshop.com",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://techrajshop.com/#organization",
      name: "Techraj Digital Shop",
      alternateName: "Techraj",
      url: "https://techrajshop.com",
      description:
        "Nepal's trusted digital products store offering PUBG UC, Freefire Diamonds, Netflix, Steam Gift Cards and 100+ instant digital products.",
    },
    {
      "@type": "WebSite",
      "@id": "https://techrajshop.com/#website",
      url: "https://techrajshop.com",
      name: "Techraj Digital Shop",
      alternateName: "Techraj",
      publisher: { "@id": "https://techrajshop.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://techrajshop.com/products?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function HomePage() {
  // 1. Initialize the Supabase client for this request
  const supabase = createAdminClient();

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      variants:product_variants(*)
    `,
    )
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(12);

  // Fetch new arrivals
  const { data: newArrivals } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      variants:product_variants(*)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  // Fetch categories for quick navigation
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(8);

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Brand hero — H1 for SEO, left-aligned per F-pattern/left-bias research */}
      <section className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900 text-white py-14 md:py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight">
              Techraj Digital Shop
            </h1>
            <p className="text-slate-300 text-base md:text-lg max-w-xl mb-8">
              Nepal&apos;s trusted marketplace for PUBG UC, Freefire Diamonds,
              Netflix, Steam Gift Cards &amp; 100+ instant digital products
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/products"
                className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/30"
              >
                Shop Now
              </Link>
              <Link
                href="#featured"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20"
              >
                Featured Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-12 bg-white scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 animate-fade-up">
                Featured Products
              </h2>
              <p className="text-slate-600 mt-2 animate-fade-up stagger-2">
                Most popular and best selling items
              </p>
            </div>
            <Link
              href="/products?sort=featured"
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProducts && featuredProducts.length > 0 ? (
            <ProductGrid
              initialProducts={featuredProducts}
              featured={true}
              showFilters={false}
            />
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
              <h2 className="text-3xl font-bold text-slate-900 animate-fade-up">
                New Arrivals
              </h2>
              <p className="text-slate-600 mt-2 animate-fade-up stagger-2">Recently added to our store</p>
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
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 animate-fade-up stagger-1">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">Instant Delivery</h3>
              <p className="text-slate-500 text-sm">Digital products delivered instantly after payment</p>
            </div>
            <div className="text-center p-6 animate-fade-up stagger-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">Secure Payment</h3>
              <p className="text-slate-500 text-sm">100% secure transactions with encrypted checkout</p>
            </div>
            <div className="text-center p-6 animate-fade-up stagger-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">24/7 Support</h3>
              <p className="text-slate-500 text-sm">Round-the-clock customer support via chat or call</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-linear-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto text-sm md:text-base">
            Join thousands of satisfied customers. Create your account and get instant access to 100+ digital products.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
          >
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
}
