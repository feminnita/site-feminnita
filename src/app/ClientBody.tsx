"use client";

import { useEffect } from "react";
import { CartProvider } from "@/lib/cart";

export default function ClientBody({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return (
    <CartProvider>
      <div className="antialiased">{children}</div>
    </CartProvider>
  );
}
