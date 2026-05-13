"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  pixPrice: number;
  installments: number;
  installmentPrice: number;
  images: string[];
  colors: string[];
  sizes: string[];
}

interface Props {
  products: Product[];
  title?: string;
  logoText?: string;
  logoBg?: string;
}

export function ProductCarousel({ products, title, logoText, logoBg = "#f5f0eb" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const w = ref.current.clientWidth;
    ref.current.scrollBy({ left: dir === "right" ? w * 0.8 : -w * 0.8, behavior: "smooth" });
  };

  return (
    <section className="w-full py-10">
      {/* Logo/título da coleção */}
      {(logoText || title) && (
        <div
          className="relative w-full mb-6 flex items-center justify-center overflow-hidden"
          style={{ background: logoBg, minHeight: "80px" }}
        >
          {logoText ? (
            <span className="text-[28px] font-light tracking-[0.25em] uppercase text-gray-800 py-5 px-8">
              {logoText}
            </span>
          ) : (
            <h2 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-700 py-5">
              {title}
            </h2>
          )}
        </div>
      )}

      {/* Carrossel */}
      <div className="relative max-w-[1400px] mx-auto px-6">
        {/* Seta esquerda */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        {/* Track */}
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide px-8"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="shrink-0"
              style={{ width: "calc(25% - 9px)", scrollSnapAlign: "start" }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {/* Seta direita */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
