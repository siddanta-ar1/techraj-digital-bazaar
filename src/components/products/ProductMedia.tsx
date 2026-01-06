"use client";

interface ProductMediaProps {
  src: string | null | undefined;
  alt: string;
}

export function ProductMedia({ src, alt }: ProductMediaProps) {
  // Defensive check: if src starts with 'http', use as is.
  // If it's a relative path (like 'products/img.png'), ensure it starts with '/'
  const validSrc = src
    ? src.startsWith("http")
      ? src
      : src.startsWith("/")
        ? src
        : `/${src}`
    : "/product-placeholder.png";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
      <img
        src={validSrc}
        alt={alt}
        className="w-full aspect-[16/9] object-cover"
        onError={(e) => {
          // Prevent infinite loop if placeholder also fails
          e.currentTarget.onerror = null;
          e.currentTarget.src =
            "https://placehold.co/800x450?text=Image+Not+Available";
        }}
      />
    </div>
  );
}
