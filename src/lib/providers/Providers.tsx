// src/lib/providers/Providers.tsx
"use client";

import { AuthProvider } from "@/lib/providers/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
