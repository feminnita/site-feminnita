"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { StylistChat } from "@/components/StylistChat";
import { saveAffiliateCode, getAffiliateCode } from "@/lib/affiliate";
import { fetchProducts, type StoreProduct } from "@/lib/products";

// Componente separado para isolar useSearchParams (obrigatório no Next.js 15)
function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams?.get("ref");
    if (ref) {
      const prev = getAffiliateCode();
      saveAffiliateCode(ref);
      if (ref.toUpperCase() !== prev) {
        fetch("/api/affiliate/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: ref }),
        }).catch(() => {});
      }
    }
  }, [searchParams]);

  return null;
}

export default function ClientBody({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    document.body.className = "antialiased";
    // Carrega produtos para o StylistChat em background
    fetchProducts({ limit: 50 }).then(setProducts).catch(() => {});
  }, []);

  return (
    <div className="antialiased">
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      {children}
      <WhatsAppButton />
      <CookieBanner />
      <StylistChat products={products as any} />
    </div>
  );
}
