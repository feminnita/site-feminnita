"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  bg: string;
  tag: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  textColor: string;
}

const slides: Slide[] = [
  {
    bg: "linear-gradient(135deg, #f5ece6 0%, #e8d5c8 100%)",
    tag: "nova coleção",
    title: "Pijamas & Camisolas",
    sub: "Conforto e elegância para cada noite",
    cta: "ver coleção",
    href: "/colecao/pijamas",
    textColor: "#5a3a2e",
  },
  {
    bg: "linear-gradient(135deg, #2e1a20 0%, #8C2F39 60%, #6b2330 100%)",
    tag: "lançamento",
    title: "Camisolas Premium",
    sub: "Tecidos suaves de alta qualidade",
    cta: "comprar agora",
    href: "/colecao/camisolas",
    textColor: "#fff",
  },
  {
    bg: "linear-gradient(135deg, #f0ebe5 0%, #ddd0c5 100%)",
    tag: "shorts doll",
    title: "Short Doll Liganete",
    sub: "Leveza e feminilidade em cada detalhe",
    cta: "ver peças",
    href: "/colecao/shorts-doll",
    textColor: "#5a3a2e",
  },
  {
    bg: "linear-gradient(135deg, #1a1a1a 0%, #3a2a2a 100%)",
    tag: "até 50% off",
    title: "Outlet Feminnita",
    sub: "Peças selecionadas com descontos especiais",
    cta: "aproveitar",
    href: "/colecao/outlet",
    textColor: "#fff",
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => setCurrent(idx), []);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const back = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    timerRef.current = setTimeout(next, 5500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, next]);

  return (
    <section className="relative w-full overflow-hidden" style={{ aspectRatio: "16/6" }}>
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          style={{ background: slide.bg }}
        >
          <Link
            href={slide.href}
            className="flex flex-col items-center justify-center h-full text-center px-6"
            style={{ color: slide.textColor }}
          >
            <p className="text-[10px] uppercase tracking-[0.5em] mb-4 opacity-70">{slide.tag}</p>
            <h2 className="text-4xl md:text-6xl font-extralight tracking-wider mb-4"
                style={{ fontFamily: "serif" }}>
              {slide.title}
            </h2>
            <p className="text-[13px] tracking-widest opacity-70 mb-10">{slide.sub}</p>
            <span
              className="text-[11px] uppercase tracking-[0.3em] px-10 py-3 border transition-all duration-300"
              style={{
                borderColor: slide.textColor === "#fff" ? "rgba(255,255,255,0.6)" : "rgba(90,58,46,0.4)",
                color: slide.textColor,
              }}
            >
              {slide.cta}
            </span>
          </Link>
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={(e) => { e.preventDefault(); back(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 transition-colors"
        aria-label="Anterior"
      >
        <ChevronLeft size={20} strokeWidth={1.5} className="text-white mix-blend-difference" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 transition-colors"
        aria-label="Próximo"
      >
        <ChevronRight size={20} strokeWidth={1.5} className="text-white mix-blend-difference" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
