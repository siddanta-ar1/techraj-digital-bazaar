"use client";

import { useState } from "react";
import { Edit3, Trash2, Search, Eye, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProductListClient({
  initialProducts,
}: {
  initialProducts: any[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(id);
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (!error) {
      setProducts(products.filter((p) => p.id !== id));
      router.refresh();
    } else {
      alert("Error deleting product");
    }
    setLoading(null);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Search Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4 font-bold">Product Details</th>
              <th className="px-6 py-4 font-bold">Category</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center text-slate-400">
                    <Search className="h-10 w-10 mb-2 opacity-20" />
                    <p>No products found matching "{search}"</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-lg bg-slate-100 relative overflow-hidden flex-shrink-0 border border-slate-200">
                        {product.featured_image ? (
                          <Image
                            src={product.featured_image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            <ImageIcon className="h-6 w-6 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-base">
                          {product.name}
                        </p>
                        <p className="text-slate-500 text-xs font-mono mt-0.5">
                          /{product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {product.category?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          product.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {product.is_active ? "Active" : "Draft"}
                      </span>
                      {product.is_featured && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View on site"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={loading === product.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        {loading === product.id ? (
                          <div className="h-4 w-4 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
