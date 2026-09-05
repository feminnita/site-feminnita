"use client";

import { Toaster } from "sonner";
import { WhatsAppButton } from "../components/common/WhatsAppButton";
import { MinOrderBar, MinOrderBottomSpacer } from "../components/common/MinOrderBar";
import { AuthProvider } from "../hooks/count/useAuth";
import { CartProvider } from "../hooks/cart/useCart";
import { ColorSwatchesProvider } from "../hooks/color/useColorSwatches";

export default function ClientBody({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <ColorSwatchesProvider>
                <CartProvider>
                    <div className="antialiased">
                        {/* Sticky no desktop: fica no topo (abaixo do header) e reserva
                            seu espaço. No celular vira barra fixa no rodapé. */}
                        <MinOrderBar />
                        {children}
                        <MinOrderBottomSpacer />
                        <WhatsAppButton />
                        <Toaster position="top-center" richColors closeButton duration={3000} />
                    </div>
                </CartProvider>
            </ColorSwatchesProvider>
        </AuthProvider>
    );
}
