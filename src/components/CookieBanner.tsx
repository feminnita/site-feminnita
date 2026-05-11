"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] text-white px-4 py-4 shadow-2xl md:flex md:items-center md:gap-6 md:px-8">
      <p className="text-sm text-gray-300 flex-1 mb-3 md:mb-0">
        Usamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego.
        Ao continuar navegando, você concorda com nossa{" "}
        <Link href="/politica-de-privacidade" className="underline text-white hover:text-gray-300">
          Política de Privacidade
        </Link>
        .
      </p>
      <div className="flex gap-3 shrink-0">
        <button
          onClick={decline}
          className="px-4 py-2 text-sm border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
        >
          Recusar
        </button>
        <button
          onClick={accept}
          className="px-5 py-2 text-sm bg-[#8C2F39] rounded-lg hover:bg-[#7a2832] transition-colors font-medium"
        >
          Aceitar cookies
        </button>
      </div>
    </div>
  );
}
