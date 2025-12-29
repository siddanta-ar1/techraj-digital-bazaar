"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Menu, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1 text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="text-xl font-black">
              <span className="text-indigo-600">TECH</span>
              <span className="text-slate-800">RAJ</span>
            </Link>

            <Link href="/cart" className="relative p-1 text-slate-600">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative bg-white w-[80%] max-w-sm h-full shadow-xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <Link
                href="/"
                className="py-2 text-slate-700 font-medium border-b border-slate-100"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="py-2 text-slate-700 font-medium border-b border-slate-100"
              >
                All Products
              </Link>
              <Link
                href="/login"
                className="py-3 mt-4 bg-indigo-600 text-white text-center rounded-lg font-bold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
