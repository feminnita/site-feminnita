"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { QuickBuyPanel } from "./QuickBuyPanel";
import { effectivePrice, hasActiveSale, pixFromPrice } from "@/src/utils/pricing";
import { normalizeColorKey } from "@/src/utils/product";
import { sortSizes } from "@/src/utils/sizes";
import type { StoreProduct } from "@/src/types/product/products";

interface ProductCardProps {
    product: StoreProduct;
    // Mostra o CÓDIGO acima do nome (foto+código+nome+preço+compra rápida).
    // Off por padrão pra não mexer na vitrine existente; ligado nos carrosséis do produto.
    showCode?: boolean;
    // Foto de OUTRA COR pra o card (afinidade de sessão, só nos carrosséis do produto).
    // Quando presente, mostra ESSA foto sem o swap de hover confuso. Sem ela = vitrine intacta.
    overrideImage?: string;
    // Nome da cor exibida no card (linha discreta sob o nome). Só com overrideImage.
    colorLabel?: string;
}

// Foto da COR (colorImages[cor][0]) tolerante a caixa/acento. undefined quando não há.
function colorThumb(
    product: Pick<StoreProduct, "colorImages">,
    color: string,
): string | undefined {
    const map = product.colorImages;
    if (!map || !color) return undefined;
    const target = normalizeColorKey(color);
    const key = Object.keys(map).find((k) => normalizeColorKey(k) === target);
    return key ? map[key]?.[0] : undefined;
}

// Card de VITRINE com COMPRA RÁPIDA dentro do card (QuickBuyPanel).
// Produto sem estoque NÃO aparece na vitrine (filtrado no backend), então o card
// sempre mostra "Comprar" — a disponibilidade fina (cor×tamanho) é conferida ao abrir.
export function ProductCard({
    product,
    showCode = false,
    overrideImage,
    colorLabel,
}: ProductCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [open, setOpen] = useState(false);
    // Cor selecionada NO CARD: troca a foto do card pela foto daquela cor (B2).
    // Só na vitrine (sem overrideImage — o carrossel do produto fixa a própria foto).
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    const effective = effectivePrice(product.price, product.salePrice, product.saleStart, product.saleEnd);
    const onSale = hasActiveSale(product.price, product.salePrice, product.saleStart, product.saleEnd);

    const href = `/produto/${product.slug ?? product.id}`;

    // Vitrine mostra bolinhas de cor + tamanhos; o carrossel do produto (overrideImage) não.
    const showVariants = !overrideImage;
    const colors = showVariants ? product.colors ?? [] : [];
    const sizes = showVariants ? sortSizes(product.sizes ?? []) : [];
    const MAX_SWATCHES = 6;

    // Foto do card: cor escolhida (se tiver foto) → senão capa. Com overrideImage, fixa.
    const colorImg = selectedColor ? colorThumb(product, selectedColor) : undefined;
    const baseImage = overrideImage ?? product.images?.[0];
    const primary = colorImg ?? baseImage;
    // Swap de hover só na vitrine SEM cor escolhida (com cor, a foto da cor permanece).
    const secondary = showVariants && !selectedColor ? product.images?.[1] : undefined;

    return (
        <div className="product-card group relative">
            <Link href={href} className="block">
                {/* Foto 3:4 — NUNCA some ao abrir a compra rápida (painel abre ao lado/abaixo) */}
                <div className="relative aspect-[3/4] overflow-hidden bg-white p-2">
                    {primary ? (
                        <div className="relative h-full w-full">
                            <Image
                                key={primary}
                                src={primary}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 50vw"
                                className={`object-contain transition-opacity duration-500 ${secondary ? "group-hover:opacity-0" : ""}`}
                                quality={90}
                            />
                            {/* Segunda foto no hover — só quando há capa alternativa
                                (vitrine). Com overrideImage/cor escolhida a foto fica fixa. */}
                            {secondary && (
                                <Image
                                    src={secondary}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 50vw"
                                    className="object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                    quality={90}
                                />
                            )}
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

            {/* Nome + variações + preço */}
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
                {colorLabel && (
                    <p className="text-xs text-gray-500">Cor: {colorLabel}</p>
                )}

                {/* Cores como BOLINHAS (foto da cor quando existir) — clicar troca a foto (B2). */}
                {colors.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {colors.slice(0, MAX_SWATCHES).map((c) => {
                            const thumb = colorThumb(product, c);
                            const active =
                                normalizeColorKey(selectedColor ?? "") === normalizeColorKey(c);
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    title={c}
                                    aria-label={`Cor ${c}`}
                                    aria-pressed={active}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedColor((prev) => (prev === c ? null : c));
                                    }}
                                    className={`relative h-6 w-6 shrink-0 overflow-hidden rounded-full border transition ${
                                        active
                                            ? "border-[#8C2F39] ring-2 ring-[#8C2F39]/40"
                                            : "border-gray-300 hover:border-[#8C2F39]"
                                    }`}
                                >
                                    {thumb ? (
                                        <Image
                                            src={thumb}
                                            alt={c}
                                            fill
                                            sizes="24px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        // Sem foto e sem HEX: swatch neutro (nome fica no title/tooltip).
                                        <span className="block h-full w-full bg-gradient-to-br from-gray-200 to-gray-400" />
                                    )}
                                </button>
                            );
                        })}
                        {colors.length > MAX_SWATCHES && (
                            <span className="text-xs text-gray-400">
                                +{colors.length - MAX_SWATCHES}
                            </span>
                        )}
                    </div>
                )}

                {/* Tamanhos como ETIQUETAS de texto: "M · G · GG". */}
                {sizes.length > 0 && (
                    <p className="text-xs tracking-wide text-gray-500">
                        {sizes.join(" · ")}
                    </p>
                )}

                <div className="flex flex-wrap items-baseline gap-x-2 pt-0.5">
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

            {open && (
                <QuickBuyPanel
                    product={product}
                    initialColor={selectedColor ?? undefined}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}
