"use client";
import { useRef } from "react";
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  pixPrice: number;
  fullPrice: number;
  installments: number;
  installmentPrice: number;
  images: string[];
  category: string;
  inStock: boolean;
}

interface Props {
  products: Product[];
  title: string;
  bg?: string;
}

export function ProductCarousel({ products, title, bg = "#fff" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const amount = ref.current.clientWidth * 0.75;
    ref.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section className="py-8" style={{ background: bg }}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[13px] font-light tracking-[0.3em] uppercase text-gray-600">
            {title}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        <div
          ref={ref}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((p) => (
            <div key={p.id} className="min-w-[220px] max-w-[220px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
