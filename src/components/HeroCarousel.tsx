"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const slides = [
  {
    bg: "linear-gradient(135deg, #2e1a20 0%, #8C2F39 60%, #6b2330 100%)",
    label: "nova coleção",
    title: "Pijamas de Inverno",
    sub: "Conforto e elegância para suas noites",
    cta: "Ver Coleção",
    href: "/colecao/pijamas",
    img: null,
  },
  {
    bg: "linear-gradient(135deg, #f5ece6 0%, #e0cfc6 100%)",
    label: "exclusivo",
    title: "Camisolas Premium",
    sub: "Sofisticação em cada detalhe",
    cta: "Comprar Agora",
    href: "/colecao/camisolas",
    img: null,
  },
  {
    bg: "linear-gradient(135deg, #1a0d10 0%, #8C2F39 50%, #5a1e27 100%)",
    label: "outlet",
    title: "Até 50% OFF",
    sub: "Qualidade Feminnita com preço especial",
    cta: "Ver Outlet",
    href: "/colecao/outlet",
    img: null,
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f0e6f0" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="min-w-full flex items-center justify-center"
            style={{
              background: slide.bg,
              minHeight: "clamp(280px, 45vw, 500px)",
            }}
          >
            <div className="text-center px-6 py-16">
              <p
                className="text-[10px] uppercase tracking-[0.5em] mb-4"
                style={{ color: slide.bg.includes("f5ece6") ? "#8C2F39" : "rgba(255,255,255,0.65)" }}
              >
                {slide.label}
              </p>
              <h2
                className="text-3xl md:text-5xl font-extralight tracking-wider mb-6"
                style={{
                  fontFamily: "serif",
                  color: slide.bg.includes("f5ece6") ? "#2e1a20" : "#fff",
                }}
              >
                {slide.title}
              </h2>
              <p
                className="text-sm mb-8 font-light"
                style={{ color: slide.bg.includes("f5ece6") ? "#666" : "rgba(255,255,255,0.8)" }}
              >
                {slide.sub}
              </p>
              <Link
                href={slide.href}
                className="inline-block text-[11px] uppercase tracking-[0.3em] px-10 py-3 border transition-colors duration-300"
                style={
                  slide.bg.includes("f5ece6")
                    ? { borderColor: "#8C2F39", color: "#8C2F39" }
                    : { borderColor: "rgba(255,255,255,0.6)", color: "#fff" }
                }
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors"
        style={{ background: "rgba(255,255,255,0.8)", color: "#333" }}
        aria-label="Anterior"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors"
        style={{ background: "rgba(255,255,255,0.8)", color: "#333" }}
        aria-label="Próximo"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="w-2.5 h-2.5 rounded-full border-0 cursor-pointer transition-all"
            style={{ background: i === current ? "#fff" : "rgba(255,255,255,0.5)" }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
