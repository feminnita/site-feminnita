"use client";

import type { StickyMobileCtaProps } from "../../types/product/products";
import { ShoppingCart } from "lucide-react";

export function StickyMobileCta({
    visible,
    productName,
    price,
    onAddToCart,
}: StickyMobileCtaProps) {
    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-40 border-t bg-white px-4 py-3 shadow-lg transition-transform duration-300 md:hidden ${visible ? "translate-y-0" : "translate-y-full"
                }`}
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-500">{productName}</p>
                    <p className="font-bold text-[#8C2F39]">
                        R$ {price.toFixed(2).replace(".", ",")}
                    </p>
                </div>
                <button
                    onClick={onAddToCart}
                    className="flex items-center gap-2 rounded-xl bg-[#8C2F39] px-5 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
                >
                    <ShoppingCart size={18} />
                    Adicionar
                </button>
            </div>
        </div>
    );
}
