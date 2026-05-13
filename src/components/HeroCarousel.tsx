"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const slides = [
  {
    type: "gradient",
    bg: "linear-gradient(135deg, #2e1a20 0%, #8C2F39 60%, #6b2330 100%)",
    label: "nova coleção",
    title: "Pijamas de Inverno",
    sub: "Conforto e elegância para suas noites mais especiais",
    cta: "Ver Coleção",
    href: "/colecao/pijamas",
    light: false,
  },
  {
    type: "gradient",
    bg: "linear-gradient(135deg, #f5ece6 0%, #e8d5c8 50%, #d4bfb0 100%)",
    label: "exclusivo",
    title: "Camisolas Premium",
    sub: "Sofisticação em cada detalhe",
    cta: "Comprar Agora",
    href: "/colecao/camisolas",
    light: true,
  },
  {
    type: "gradient",
    bg: "linear-gradient(135deg, #1a0d10 0%, #8C2F39 50%, #5a1e27 100%)",
    label: "dormir bem é se amar",
    title: "Shorts Doll",
    sub: "Leveza e feminilidade para o seu descanso",
    cta: "Ver Shorts Doll",
    href: "/colecao/shorts-doll",
    light: false,
  },
  {
    type: "gradient",
    bg: "linear-gradient(135deg, #2e1a20 0%, #4a2030 40%, #8C2F39 100%)",
    label: "conjuntos",
    title: "Conjuntos Coordenados",
    sub: "Estilo e conforto em perfeita harmonia",
    cta: "Ver Conjuntos",
    href: "/colecao/conjuntos",
    light: false,
  },
  {
    type: "gradient",
    bg: "linear-gradient(135deg, #3d1a1a 0%, #8C2F39 45%, #c0415a 100%)",
    label: "outlet",
    title: "Até 50% OFF",
    sub: "Qualidade Feminnita com preço especial",
    cta: "Ver Outlet",
    href: "/colecao/outlet",
    light: false,
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setTransitioning(false), 600);
  }, [transitioning]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  const slide = slides[current];

  return (
    <section
      className="relative overflow-hidden select-none"
      style={{ height: "clamp(400px, 60vw, 620px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
          style={{
            background: s.bg,
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 1 : 0,
          }}
        >
          <div className="text-center px-6 max-w-2xl">
            <p
              className="text-[11px] uppercase tracking-[0.6em] mb-5 font-light"
              style={{ color: s.light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.6)" }}
            >
              {s.label}
            </p>
            <h2
              className="font-extralight tracking-wider mb-5 leading-tight"
              style={{
                fontFamily: "serif",
                color: s.light ? "#2e1a20" : "#fff",
                fontSize: "clamp(2rem, 5vw, 4rem)",
              }}
            >
              {s.title}
            </h2>
            <p
              className="text-sm font-light mb-10 leading-relaxed"
              style={{ color: s.light ? "#666" : "rgba(255,255,255,0.75)" }}
            >
              {s.sub}
            </p>
            <Link
              href={s.href}
              className="inline-block text-[11px] uppercase tracking-[0.35em] px-12 py-4 border transition-all duration-300 hover:scale-105"
              style={
                s.light
                  ? { borderColor: "#8C2F39", color: "#8C2F39" }
                  : { borderColor: "rgba(255,255,255,0.65)", color: "#fff" }
              }
            >
              {s.cta}
            </Link>
          </div>
        </div>
      ))}

      {/* Arrow — prev */}
      <button
        onClick={prev}
        className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all duration-200 hover:scale-110 z-10"
        style={{ background: "rgba(255,255,255,0.85)", color: "#333" }}
        aria-label="Anterior"
      >
        ‹
      </button>

      {/* Arrow — next */}
      <button
        onClick={next}
        className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all duration-200 hover:scale-110 z-10"
        style={{ background: "rgba(255,255,255,0.85)", color: "#333" }}
        aria-label="Próximo"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full border-0 cursor-pointer transition-all duration-300"
            style={{
              width: i === current ? 24 : 10,
              height: 10,
              background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div
        className="absolute bottom-5 right-6 text-[11px] z-10"
        style={{ color: slide.light ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)" }}
      >
        {current + 1} / {slides.length}
      </div>
    </section>
  );
}
