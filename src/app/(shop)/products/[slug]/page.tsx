import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import Image from "next/image";
import { PurchaseSection } from "@/components/products/PurchaseSection";
import { ProductMedia } from "@/components/products/ProductMedia";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} - Techraj Digital Bazar`,
    description: product.description?.substring(0, 160),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`*, category:categories(*), variants:product_variants(*)`)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) notFound();

  const sortedVariants =
    product.variants?.sort((a: any, b: any) => a.price - b.price) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <Breadcrumb category={product.category} product={product} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* USE THE CLIENT COMPONENT HERE */}
            <ProductMedia src={product.featured_url} alt={product.name} />

            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                Product Details
              </h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {product.description || "No description available."}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* USE THE CLIENT COMPONENT HERE */}
            <PurchaseSection product={product} variants={sortedVariants} />

            {/* Payment Gateways - Professional Styling */}
            <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">
                Accepted Payment Methods
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { name: "Esewa", color: "bg-[#60bb46]" },
                  { name: "Khalti", color: "bg-[#5c2d91]" },
                  { name: "IME Pay", color: "bg-[#ed1c24]" },
                ].map((pay) => (
                  <span
                    key={pay.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-700"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${pay.color}`}
                    ></span>
                    {pay.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
