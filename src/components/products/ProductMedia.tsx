"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductMediaProps {
  src: string | null | undefined;
  alt: string;
}

export function ProductMedia({ src, alt }: ProductMediaProps) {
  const validSrc = src
    ? src.startsWith("http")
      ? src
      : src.startsWith("/")
        ? src
        : `/${src}`
    : "/product-placeholder.png";

  const [imgSrc, setImgSrc] = useState(validSrc);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
      <div className="relative w-full aspect-video">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 800px"
          onError={() => setImgSrc("/product-placeholder.png")}
        />
      </div>
    </div>
  );
}
