"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  src: string;
  alt: string;
  href: string;
}

const slides: Slide[] = [
  { src: "/banners/banner-1.jpg", alt: "Nova Coleção Feminnita", href: "/colecao/pijamas" },
  { src: "/banners/banner-2.jpg", alt: "Conjuntos Femininos", href: "/colecao/conjuntos" },
  { src: "/banners/banner-3.jpg", alt: "Camisolas Especiais", href: "/colecao/camisolas" },
  { src: "/banners/banner-4.jpg", alt: "Outlet — Até 50% OFF", href: "/colecao/outlet" },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setPrev(current);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const back = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    timerRef.current = setTimeout(next, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, next]);

  return (
    <section className="relative w-full overflow-hidden bg-[#f5f0eb]" style={{ aspectRatio: "16/7" }}>
      {slides.map((slide, i) => (
        <Link
          key={i}
          href={slide.href}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={i === 0}
          />
        </Link>
      ))}

      {/* Arrows */}
      <button
        onClick={(e) => { e.preventDefault(); back(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/60 hover:bg-white text-gray-800 p-2 transition-colors"
        aria-label="Anterior"
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/60 hover:bg-white text-gray-800 p-2 transition-colors"
        aria-label="Próximo"
      >
        <ChevronRight size={20} strokeWidth={1.5} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
