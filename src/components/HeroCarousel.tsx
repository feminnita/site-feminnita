"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide =
  | { type: "image"; src: string; alt: string; cta?: { text: string; href: string } }
  | { type: "video"; src: string; poster?: string; cta?: { text: string; href: string } };

const slides: Slide[] = [
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/2302845870.webp",
    alt: "Coleção Feminnita",
    cta: { text: "VER COLEÇÃO", href: "/produtos" },
  },
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/1774049605.webp",
    alt: "Flowing Collection",
    cta: { text: "COMPRAR AGORA", href: "/lancamentos" },
  },
  {
    type: "video",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    poster: "https://ext.same-assets.com/2738959979/2302845870.webp",
    cta: { text: "CONHECER MARCA", href: "/sobre" },
  },
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/1774049605.webp",
    alt: "Mais Vendidos",
    cta: { text: "MAIS VENDIDOS", href: "/mais-vendidos" },
  },
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/2302845870.webp",
    alt: "Outlet Feminnita",
    cta: { text: "OUTLET — ATÉ 50% OFF", href: "/outlet" },
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setIsTransitioning(false);
    }, 300);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  useEffect(() => {
    const slide = slides[current];
    if (slide.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    timerRef.current = setTimeout(() => {
      next();
    }, slide.type === "video" ? 12000 : 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  const slide = slides[current];

  return (
    <section className="relative h-[600px] bg-black overflow-hidden">
      {/* Slide content */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {slide.type === "image" ? (
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={current === 0}
          />
        ) : (
          <video
            ref={videoRef}
            src={slide.src}
            poster={slide.poster}
            className="w-full h-full object-cover"
            muted
            playsInline
            loop={false}
          />
        )}

        {/* Overlay escuro suave */}
        <div className="absolute inset-0 bg-black/30" />

        {/* CTA */}
        {slide.cta && (
          <div className="absolute inset-0 flex items-end justify-center pb-20">
            <a
              href={slide.cta.href}
              className="px-8 py-3 bg-white text-black text-sm font-semibold tracking-widest hover:bg-black hover:text-white transition-colors duration-300"
            >
              {slide.cta.text}
            </a>
          </div>
        )}
      </div>

      {/* Setas */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
        aria-label="Anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
        aria-label="Próximo"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
