"use client";

import type { StickyMobileCtaProps } from "../../types/product/products";
import { ShoppingCart } from "lucide-react";

export function StickyMobileCta({
    visible,
    productName,
    price,
    onAddToCart,
    disabled = false,
}: StickyMobileCtaProps) {
    return (
        <div
            // Fica EM CIMA da barra do pedido minimo quando ela existe (a altura
            // vem de --barra-minimo-h, publicada pela MinOrderBar); sem ela, no
            // rodape. Escondida, some de vez: so descer nao basta, porque cairia
            // justamente sobre a barra do minimo.
            className={`fixed left-0 right-0 z-40 border-t bg-white px-4 py-3 shadow-lg transition-transform duration-300 md:hidden ${visible ? "translate-y-0" : "pointer-events-none translate-y-full opacity-0"
                }`}
            style={{
                bottom: "var(--barra-minimo-h, 0px)",
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
            }}
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-500">{productName}</p>
                    <p className="font-bold text-[#000000]">
                        R$ {price.toFixed(2).replace(".", ",")}
                    </p>
                </div>
                <button
                    onClick={onAddToCart}
                    className="flex items-center gap-2 rounded-xl bg-[#000000] px-5 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
                >
                    <ShoppingCart size={18} />
                    {disabled ? "Escolha o tamanho" : "Adicionar"}
                </button>
            </div>
        </div>
    );
}
