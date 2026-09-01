



import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const hasStickyCta = pathname?.startsWith("/produto/") ?? false;

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
    <div
      className={`fixed left-0 right-0 z-50 bg-[#1A1A1A] px-4 py-4 text-white shadow-2xl md:bottom-0 md:flex md:items-center md:gap-6 md:px-8 ${
        hasStickyCta
          ? "bottom-[calc(6rem+env(safe-area-inset-bottom))]"
          : "bottom-0"
      }`}
    >
      <p className="mb-3 flex-1 text-sm text-gray-300 md:mb-0">
        Usamos cookies para melhorar sua experiência, personalizar conteúdo e
        analisar nosso tráfego. Ao continuar navegando, você concorda com nossa{" "}
        <Link
          href="/politica-de-privacidade"
          className="text-white underline hover:text-gray-300"
        >
          Política de Privacidade
        </Link>
        .
      </p>
      <div className="flex shrink-0 gap-3">
        <button
          onClick={decline}
          className="rounded-lg border border-white/30 px-4 py-2 text-sm transition-colors hover:bg-white/10"
        >
          Recusar
        </button>
        <button
          onClick={accept}
          className="rounded-lg bg-[#8C2F39] px-5 py-2 text-sm font-medium transition-colors hover:bg-[#7a2832]"
        >
          Aceitar cookies
        </button>
      </div>
    </div>
  );
}
