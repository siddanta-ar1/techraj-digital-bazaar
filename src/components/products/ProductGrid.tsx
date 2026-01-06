"use client";

import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  initialProducts: any[]; // The prop causing the error
  featured?: boolean; // Optional prop
  showFilters?: boolean; // Optional prop
}

export function ProductGrid({
  initialProducts,
  featured = false,
  showFilters = true,
}: ProductGridProps) {
  // Your existing logic here (filtering, state, etc.)
  // For the Home Page, you likely just want to map through the initialProducts:

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {initialProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
