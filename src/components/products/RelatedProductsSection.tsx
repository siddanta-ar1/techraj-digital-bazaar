"use client";

import dynamic from "next/dynamic";
import { Product } from "@/types/product";

const RelatedProducts = dynamic(
  () =>
    import("@/components/products/RelatedProducts").then(
      (m) => ({ default: m.RelatedProducts }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-2xl aspect-square animate-pulse" />
        ))}
      </div>
    ),
  },
);

export function RelatedProductsSection({ products }: { products: Product[] }) {
  return <RelatedProducts products={products} />;
}
