"use client";

import { useEffect } from "react";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { StylistChat } from "@/components/StylistChat";
import productsData from "@/data/products.json";

export default function ClientBody({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return (
    <div className="antialiased">
      {children}
      <WhatsAppButton />
      <CookieBanner />
      <StylistChat products={productsData as any} />
    </div>
  );
}
