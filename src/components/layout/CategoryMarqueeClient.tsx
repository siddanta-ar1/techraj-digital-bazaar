"use client";

import Link from "next/link";
import { useState } from "react";

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
  const [isPaused, setIsPaused] = useState(false);

  // If no categories, return null or a skeleton
  if (!categories || categories.length === 0) return null;

  // Triplicate the list to ensure smooth infinite scrolling
  const marqueeList = [...categories, ...categories, ...categories];

  return (
    <div className="border-b border-slate-200 bg-white relative z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 font-bold text-slate-700 text-sm whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Trending Categories:
          </div>

          <div
            className="flex-1 overflow-hidden relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Gradient Masks for smooth fade effect on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10"></div>

            <div
              className={`flex gap-8 whitespace-nowrap w-max ${isPaused ? "animation-paused" : "animate-marquee"}`}
              style={{ willChange: "transform" }}
            >
              {marqueeList.map((category, index) => (
                <Link
                  key={`${category.id}-${index}`}
                  href={`/products?category=${category.slug}`}
                >
                  <div
                    // Using index in key because we are duplicating items

                    className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group bg-white"
                  >
                    <div
                      className={`p-1.5 rounded-full ${category.color} group-hover:scale-110 transition-transform`}
                    >
                      {category.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600">
                      {category.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
