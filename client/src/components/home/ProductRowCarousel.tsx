"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "../product/ProductCard";
import type { StoreProduct } from "../../types/product/products";

// Fileira da VITRINE em carrossel: arrasta com o dedo no celular, setas no
// computador, e NUNCA gira sozinho (produto que se mexe atrapalha quem está
// escolhendo). É irmão do ProductCarousel da página do produto, mas separado
// de propósito: lá o título fica à esquerda com as setas do lado e o bloco
// some com menos de 4 produtos; aqui o título é centralizado pela home e a
// fileira precisa aparecer mesmo com 1 produto marcado.
//
// Mesma quantidade por tela da grade que existia antes (2 / 3 / 5), então com
// até 5 produtos a vitrine fica visualmente igual ao que já estava no ar — as
// setas nem aparecem. O ganho só começa do 6º produto em diante.
export function ProductRowCarousel({ products }: { products: StoreProduct[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        // O respiro lateral (px-2) + o encaixe deixam a fileira PARADA em 8px, não
        // em 0. Comparar com 0 acendia a seta da esquerda logo na abertura, sem ter
        // nada à esquerda pra ver. Medido: repouso = padding-left exato.
        const repouso = parseFloat(getComputedStyle(el).paddingLeft) || 0;
        setCanLeft(el.scrollLeft > repouso + 4);
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
    }, [updateArrows, products.length]);

    const scrollByPage = (dir: 1 | -1) => {
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

    // Cabe tudo na tela: sem setas, sem sombra de seta por cima do produto.
    const temSetas = canLeft || canRight;

    const seta =
        "absolute top-1/3 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center " +
        "rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md transition-colors " +
        "hover:border-[#8C2F39] hover:text-[#8C2F39] disabled:cursor-not-allowed disabled:opacity-0 md:flex";

    return (
        <div className="relative">
            {temSetas && (
                <>
                    <button
                        type="button"
                        aria-label="Produtos anteriores"
                        onClick={() => scrollByPage(-1)}
                        disabled={!canLeft}
                        className={`${seta} left-0`}
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <button
                        type="button"
                        aria-label="Próximos produtos"
                        onClick={() => scrollByPage(1)}
                        disabled={!canRight}
                        className={`${seta} right-0`}
                    >
                        <ChevronRight size={22} />
                    </button>
                </>
            )}

            <div
                ref={scrollRef}
                className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 pb-2 md:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {products.map((product) => (
                    <div
                        key={product.id}
                        // Desktop e tablet: 5 e 3 por tela, igual à grade que existia
                        // (o basis desconta o gap pra não estourar a linha).
                        // Celular: 43% = 2 cards INTEIROS + uma fatia do terceiro. A fatia
                        // é o que avisa que a fileira anda — sem ela, com as setas
                        // escondidas no celular, parece que só existem 2 produtos.
                        className="shrink-0 basis-[43%] snap-start md:basis-[calc(33.333%-1rem)] lg:basis-[calc(20%-1.2rem)]"
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
}
