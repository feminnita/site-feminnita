"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { effectivePrice, hasActiveSale, pixFromPrice } from "@/src/utils/pricing";

interface ProductCardProps {
    product: {
        id: string;
        code: string;
        name: string;
        slug?: string;
        price: number;
        salePrice?: number | null;
        images: string[];
        colorImages?: Record<string, string[]>;
        colors: string[];
        sizes: string[];
    };
}

// Card de VITRINE (minimalista): foto grande 3:4, nome e preço.
// Cor, tamanho e quantidade são escolhidos na PÁGINA DO PRODUTO — não aqui.
export function ProductCard({ product }: ProductCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);

    const effective = effectivePrice(product.price, product.salePrice);
    const onSale = hasActiveSale(product.price, product.salePrice);

    const href = `/produto/${product.slug ?? product.id}`;

    const primary = product.images?.[0];
    const secondary = product.images?.[1];

    return (
        <div className="product-card group relative">
            <Link href={href} className="block">
                {/* Foto 3:4 */}
                {/* Fundo branco + respiro; object-contain nao corta nem amplia
                    (catalogo tem proporcoes mistas). Volta a object-contain quando as
                    fotos entrarem padronizadas em 1200x1600 (3:4). */}
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
                        // Placeholder neutro com a marca — discreto, sem ícone de imagem quebrada.
                        <div className="flex h-full w-full items-center justify-center bg-[#F3EEE9]">
                            <span className="text-lg font-light tracking-[0.2em] text-[#8C2F39]/40">
                                Feminnita
                            </span>
                        </div>
                    )}

                    {onSale && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#8C2F39] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Oferta
                        </span>
                    )}

                    {/* Ações no hover, sobre a foto */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center gap-2 p-3 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="flex-1 rounded-full bg-[#8C2F39] py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[#FAF6F2] shadow-md transition-colors group-hover:bg-[#7a2832]">
                            Comprar
                        </span>
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
            </div>
        </div>
    );
}
