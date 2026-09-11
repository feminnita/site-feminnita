"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { WhatsAppButton } from "../components/common/WhatsAppButton";
import { NewsletterPopup } from "../components/common/NewsletterPopup";
import { MinOrderBar, MinOrderBottomSpacer } from "../components/common/MinOrderBar";
import { Footer } from "../components/layout/Footer";
import { AuthProvider } from "../hooks/count/useAuth";
import { CartProvider } from "../hooks/cart/useCart";
import { ColorSwatchesProvider } from "../hooks/color/useColorSwatches";
import { registrarOrigem } from "../lib/origemDaVisita";
import { registrar } from "../lib/eventos";
import { usePathname } from "next/navigation";

export default function ClientBody({
    children,
}: {
    children: React.ReactNode;
}) {
    // Guarda de onde a pessoa veio logo na chegada. Precisa ser aqui: quem clica
    // no anuncio cai numa pagina com ?utm_campaign=..., navega, e no checkout a
    // URL ja nao tem mais nada — sem registrar na entrada, a origem se perde no
    // primeiro clique e nao da para saber qual arte gerou a venda.
    useEffect(() => {
        registrarOrigem();
    }, []);

    // Uma visita de pagina por rota. Aqui e nao em cada page.tsx porque a loja
    // e SPA: trocar de pagina nao recarrega nada, entao so o pathname avisa.
    // registrarOrigem() roda antes, para o primeiro evento ja sair com a origem.
    const rota = usePathname();
    useEffect(() => {
        registrar("page_view");
    }, [rota]);

    return (
        <AuthProvider>
            <ColorSwatchesProvider>
                <CartProvider>
                    <div className="antialiased">
                        {/* Sticky no desktop: fica no topo (abaixo do header) e reserva
                            seu espaço. No celular vira barra fixa no rodapé. */}
                        <MinOrderBar />
                        {children}
                        <Footer />
                        <MinOrderBottomSpacer />
                        <WhatsAppButton />
                        <NewsletterPopup />
                        <Toaster position="top-center" richColors closeButton duration={3000} />
                    </div>
                </CartProvider>
            </ColorSwatchesProvider>
        </AuthProvider>
    );
}
