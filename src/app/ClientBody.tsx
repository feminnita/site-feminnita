"use client";

import { useEffect } from "react";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function ClientBody({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return (
    <div className="antialiased">
      {children}
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
}
