"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  slug: string;
}

export function CategoryMarqueeClient({
  categories,
}: {
  categories: CategoryItem[];
}) {
  // If no categories, return null
  if (!categories || categories.length === 0) return null;

  // Quadruple the list to ensure there's enough content to scroll/loop smoothly
  const marqueeList = [
    ...categories,
    ...categories,
    ...categories,
    ...categories,
  ];

  return (
    <div className="border-b border-slate-200 bg-white relative z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Label - Fixed */}
          <div className="flex items-center gap-2 font-bold text-slate-700 text-sm whitespace-nowrap border-r border-slate-100 pr-4">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="hidden sm:inline">Trending Categories:</span>
            <span className="sm:hidden text-indigo-600">Trending:</span>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 relative group overflow-hidden">
            {/* Edge Gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            {/* The Marquee Wrapper */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth items-center py-1">
              {/* The Inner Moving Row */}
              <div className="flex gap-4 animate-marquee-infinite group-hover:pause-animation">
                {marqueeList.map((category, index) => (
                  <Link
                    key={`${category.id}-${index}`}
                    href={`/products?category=${category.id}`}
                    className="flex items-center gap-3 px-5 py-2 rounded-full border border-slate-100 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group bg-white whitespace-nowrap shadow-sm"
                  >
                    <div
                      className={`p-1.5 rounded-full ${category.color} group-hover:scale-110 transition-transform`}
                    >
                      {category.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
