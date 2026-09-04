"use client";

import Link from "next/link";
import type { ProductActionsProps } from "../../types/product/products";
import { Heart, ShoppingCart } from "lucide-react";

export function ProductActions({
    ctaRef,
    productId,
    isFavorite,
    onToggleFavorite,
    onAddToCart,
    disabled = false,
}: ProductActionsProps) {
    return (
        <>
            <div ref={ctaRef} className="flex gap-4">
                <button
                    onClick={onAddToCart}
                    disabled={disabled}
                    title={disabled ? "Selecione um tamanho" : undefined}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8C2F39] py-4 font-semibold text-[#FAF6F2] transition-colors hover:bg-[#7a2832] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
                >
                    <ShoppingCart size={20} />
                    {disabled ? "Selecione um tamanho" : "Adicionar ao Carrinho"}
                </button>
                <button
                    onClick={onToggleFavorite}
                    className="flex h-14 w-14 items-center justify-center rounded-lg border-2 hover:bg-gray-50"
                >
                    <Heart
                        size={24}
                        className={isFavorite ? "fill-red-500 text-red-500" : ""}
                    />
                </button>
            </div>

            {/* <Link href={`/provador?produto=${productId}`}>
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#8C2F39] py-4 font-semibold text-[#8C2F39] transition-all hover:bg-[#8C2F39] hover:text-[#FAF6F2]">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Provador Virtual
                </button>
            </Link> */}
        </>
    );
}
