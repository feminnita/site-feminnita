"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "./ProductCard";
import { getSignals, pickCarouselVariant } from "../../lib/colorAffinity";
import type { StoreProduct } from "../../types/product/products";

type Props = {
    title: string;
    products: StoreProduct[];
};

// Carrossel HORIZONTAL de produtos com setas + scroll-snap.
// 1,5 cards no celular (mostra pedaço do próximo), 2 no sm, 4 no desktop.
// Só entram produtos COM FOTO e COM ESTOQUE; se sobrarem < 4, o bloco NÃO aparece.
export function ProductCarousel({ title, products }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    // Filtro de segurança (foto + estoque) e teto de 6 — a seleção já vem pronta,
    // mas garantimos aqui pra nunca renderizar card sem foto ou esgotado.
    const items = products
        .filter((p) => (p.images?.length ?? 0) > 0 && p.stock > 0)
        .slice(0, 6);

    // Afinidade de cor por sessão: escolhe UMA foto de cor por produto, calculada
    // uma vez no mount (getSignals lido uma vez). Estável enquanto o carrossel vive.
    const variants = useMemo(() => {
        const signals = getSignals();
        const map = new Map<string, { image: string; colorLabel: string } | null>();
        for (const p of products) map.set(p.id, pickCarouselVariant(p, signals));
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products]);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft < maxScroll - 4);
    }, []);

    useEffect(() => {
        updateArrows();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", updateArrows, { passive: true });
        window.addEventListener("resize", updateArrows);
        return () => {
            el.removeEventListener("scroll", updateArrows);
            window.removeEventListener("resize", updateArrows);
        };
    }, [updateArrows, items.length]);

    const scrollByCards = (dir: 1 | -1) => {
        const el = scrollRef.current;
        if (!el) return;
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollBy({
            left: dir * el.clientWidth,
            behavior: reduce ? "auto" : "smooth",
        });
    };

    // Menos de 4 produtos: nada de carrossel com buraco.
    if (items.length < 4) return null;

    return (
        <section className="mt-16">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-light">{title}</h2>
                <div className="hidden gap-2 md:flex">
                    <button
                        type="button"
                        aria-label="Anterior"
                        onClick={() => scrollByCards(-1)}
                        disabled={!canLeft}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-colors hover:border-[#8C2F39] hover:text-[#8C2F39] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        aria-label="Próximo"
                        onClick={() => scrollByCards(1)}
                        disabled={!canRight}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-colors hover:border-[#8C2F39] hover:text-[#8C2F39] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map((product) => {
                    const variant = variants.get(product.id);
                    return (
                        <div
                            key={product.id}
                            className="shrink-0 basis-[66%] snap-start sm:basis-1/2 lg:basis-1/4"
                        >
                            <ProductCard
                                product={product}
                                showCode
                                overrideImage={variant?.image}
                                colorLabel={variant?.colorLabel}
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
