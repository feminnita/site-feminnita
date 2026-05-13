"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Slide {
  id: string;
  type: string;
  src: string;
  alt?: string | null;
  poster?: string | null;
  cta_text?: string | null;
  cta_href?: string | null;
  order_index: number;
  active: boolean;
}

// Fallback slides when Supabase has no data
const fallbackSlides: Slide[] = [
  { id: "1", type: "gradient", src: "linear-gradient(135deg,#2e1a20,#8C2F39,#6b2330)", cta_text: "Ver Coleção", cta_href: "/colecao/pijamas", order_index: 0, active: true, alt: "Pijamas de Inverno" },
  { id: "2", type: "gradient", src: "linear-gradient(135deg,#f5ece6,#e8d5c8,#d4bfb0)", cta_text: "Comprar Agora", cta_href: "/colecao/camisolas", order_index: 1, active: true, alt: "Camisolas Premium" },
  { id: "3", type: "gradient", src: "linear-gradient(135deg,#1a0d10,#8C2F39,#5a1e27)", cta_text: "Ver Shorts Doll", cta_href: "/colecao/shorts-doll", order_index: 2, active: true, alt: "Shorts Doll" },
  { id: "4", type: "gradient", src: "linear-gradient(135deg,#2e1a20,#4a2030,#8C2F39)", cta_text: "Ver Conjuntos", cta_href: "/colecao/conjuntos", order_index: 3, active: true, alt: "Conjuntos" },
  { id: "5", type: "gradient", src: "linear-gradient(135deg,#3d1a1a,#8C2F39,#c0415a)", cta_text: "Ver Outlet", cta_href: "/colecao/outlet", order_index: 4, active: true, alt: "Até 50% OFF" },
];

interface Props {
  slides?: Slide[];
}

export function HeroCarousel({ slides: propSlides }: Props) {
  const slides = (propSlides && propSlides.length > 0) ? propSlides : fallbackSlides;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => setCurrent(idx), []);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, slides.length]);

  const slide = slides[current];
  const isGradient = slide.type === "gradient" || slide.src.startsWith("linear-gradient");
  const isLight = slide.src.includes("f5ece6") || slide.src.includes("fdf6f0");

  return (
    <section
      className="relative overflow-hidden select-none"
      style={{ height: "clamp(400px, 60vw, 620px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const isGrad = s.type === "gradient" || s.src.startsWith("linear-gradient");
        return (
          <div
            key={s.id}
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
            style={{
              opacity: i === current ? 1 : 0,
              zIndex: i === current ? 1 : 0,
              background: isGrad ? s.src : undefined,
            }}
          >
            {/* Video */}
            {s.type === "video" && (
              <video
                src={s.src}
                poster={s.poster || undefined}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Image */}
            {s.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.src} alt={s.alt || ""} className="absolute inset-0 w-full h-full object-cover" />
            )}

            {/* Overlay for image/video */}
            {(s.type === "image" || s.type === "video") && (
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
            )}

            {/* Content */}
            {(s.cta_text || s.alt) && (
              <div className="relative text-center px-6 max-w-2xl z-10">
                {s.alt && (
                  <h2
                    className="font-extralight tracking-wider mb-5 leading-tight"
                    style={{
                      fontFamily: "serif",
                      color: isGrad && isLight ? "#2e1a20" : "#fff",
                      fontSize: "clamp(2rem, 5vw, 4rem)",
                    }}
                  >
                    {s.alt}
                  </h2>
                )}
                {s.cta_text && s.cta_href && (
                  <Link
                    href={s.cta_href}
                    className="inline-block text-[11px] uppercase tracking-[0.35em] px-12 py-4 border transition-all duration-300 hover:scale-105"
                    style={
                      isGrad && isLight
                        ? { borderColor: "#8C2F39", color: "#8C2F39" }
                        : { borderColor: "rgba(255,255,255,0.65)", color: "#fff" }
                    }
                  >
                    {s.cta_text}
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Arrows */}
      <button onClick={prev} className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-xl z-10 hover:scale-110 transition-all"
        style={{ background: "rgba(255,255,255,0.85)", color: "#333" }} aria-label="Anterior">‹</button>
      <button onClick={next} className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-xl z-10 hover:scale-110 transition-all"
        style={{ background: "rgba(255,255,255,0.85)", color: "#333" }} aria-label="Próximo">›</button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className="rounded-full border-0 cursor-pointer transition-all duration-300"
            style={{ width: i === current ? 24 : 10, height: 10, background: i === current ? "#fff" : "rgba(255,255,255,0.45)" }}
            aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      <div className="absolute bottom-5 right-6 text-[11px] z-10"
        style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)" }}>
        {current + 1} / {slides.length}
      </div>
    </section>
  );
}
