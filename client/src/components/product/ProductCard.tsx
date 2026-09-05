"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { QuickBuyPanel } from "./QuickBuyPanel";
import { effectivePrice, hasActiveSale, pixFromPrice } from "@/src/utils/pricing";
import type { StoreProduct } from "@/src/types/product/products";

interface ProductCardProps {
    product: StoreProduct;
    // Mostra o CÓDIGO acima do nome (foto+código+nome+preço+compra rápida).
    // Off por padrão pra não mexer na vitrine existente; ligado nos carrosséis do produto.
    showCode?: boolean;
}

// Card de VITRINE com COMPRA RÁPIDA dentro do card (QuickBuyPanel).
// Produto sem estoque NÃO aparece na vitrine (filtrado no backend), então o card
// sempre mostra "Comprar" — a disponibilidade fina (cor×tamanho) é conferida ao abrir.
export function ProductCard({ product, showCode = false }: ProductCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [open, setOpen] = useState(false);

    const effective = effectivePrice(product.price, product.salePrice);
    const onSale = hasActiveSale(product.price, product.salePrice);

    const href = `/produto/${product.slug ?? product.id}`;

    const primary = product.images?.[0];
    const secondary = product.images?.[1];

    return (
        <div className="product-card group relative">
            <Link href={href} className="block">
                {/* Foto 3:4 */}
                <div className="relative aspect-[3/4] overflow-hidden bg-white p-2">
                    {primary ? (
                        <div className="relative h-full w-full">
                            <Image
                                src={primary}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 50vw"
                                className="object-contain transition-opacity duration-500 group-hover:opacity-0"
                                quality={90}
                            />
                            {/* Segunda foto no hover (quando existir) */}
                            <Image
                                src={secondary ?? primary}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 50vw"
                                className="object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                quality={90}
                            />
                        </div>
                    ) : (
                        // Placeholder neutro com o NOME do produto — nunca quadrado quebrado.
                        <div className="flex h-full w-full items-center justify-center bg-[#F3EEE9] p-4">
                            <span className="line-clamp-4 text-center text-sm font-light tracking-wide text-[#8C2F39]/60">
                                {product.name}
                            </span>
                        </div>
                    )}

                    {onSale && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#8C2F39] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Oferta
                        </span>
                    )}

                    {/* Favoritar no hover, sobre a foto */}
                    <div className="pointer-events-none absolute right-3 top-3 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
                        <button
                            type="button"
                            aria-label="Favoritar"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsFavorite((v) => !v);
                            }}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-md transition-colors hover:bg-white"
                        >
                            <Heart
                                size={18}
                                className={isFavorite ? "fill-[#8C2F39] text-[#8C2F39]" : "text-gray-700"}
                            />
                        </button>
                    </div>
                </div>
            </Link>

            {/* Nome + preço */}
            <div className="mt-3 space-y-1">
                {showCode && product.code && (
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        {product.code}
                    </p>
                )}
                <Link href={href}>
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-900 transition-colors hover:text-[#8C2F39]">
                        {product.name}
                    </h3>
                </Link>
                <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-base font-semibold text-gray-900">
                        R$ {effective.toFixed(2).replace(".", ",")}
                    </p>
                    {onSale && (
                        <p className="text-sm text-gray-400 line-through">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                        </p>
                    )}
                </div>
                <p className="text-xs text-gray-500">
                    R$ {pixFromPrice(effective).toFixed(2).replace(".", ",")} no PIX
                </p>

                {/* CTA persistente (mobile-first): grande, sempre visível ao toque. */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(true);
                    }}
                    className="mt-2 w-full rounded-full bg-[#8C2F39] py-3 text-sm font-semibold uppercase tracking-wide text-[#FAF6F2] transition-colors hover:bg-[#7a2832]"
                >
                    Comprar
                </button>
            </div>

            {open && <QuickBuyPanel product={product} onClose={() => setOpen(false)} />}
        </div>
    );
}
