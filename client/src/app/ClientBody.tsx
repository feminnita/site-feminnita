"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { WhatsAppButton } from "../components/common/WhatsAppButton";
import { MinOrderBar, MinOrderBottomSpacer } from "../components/common/MinOrderBar";
import { Footer } from "../components/layout/Footer";
import { AuthProvider } from "../hooks/count/useAuth";
import { CartProvider } from "../hooks/cart/useCart";
import { ColorSwatchesProvider } from "../hooks/color/useColorSwatches";
import { registrarOrigem } from "../lib/origemDaVisita";
import { registrarAfiliada } from "../lib/afiliada";
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
        // ?ref=CODIGO tem que ser lido na CHEGADA: a cliente navega, o parametro
        // some da URL no primeiro clique, e no checkout nao haveria como saber
        // qual afiliada trouxe a venda.
        registrarAfiliada();
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
                        {/* O pop-up do cupom (NewsletterPopup) saiu em 17/11/2026 por ordem da
                            Chris: abria aos 12s cobrindo a tela inteira e, na pagina da 59000,
                            19 de 117 toques eram so para fechar. O componente segue no
                            repositorio, desligado. */}
                        <Toaster position="top-center" richColors closeButton duration={3000} />
                    </div>
                </CartProvider>
            </ColorSwatchesProvider>
        </AuthProvider>
    );
}
