"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "../../types/banners/banners";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HeroCarousel({ slides }: { slides: Slide[] }) {
    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    // SSR/1º render = mobile (só poster, sem <video> no DOM). Vira desktop no cliente >=768px.
    const [isDesktop, setIsDesktop] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // detecta desktop (>=768px) só no cliente, sem mismatch de hidratação
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

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

    // avanço automático — NÃO dá play no mount (péssimo p/ LCP)
    useEffect(() => {
        if (slides.length === 0) return;
        const slide = slides[current];

        timerRef.current = setTimeout(
            () => {
                next();
            },
            slide.type === "video" ? 12000 : 5000,
        );

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [current, slides]);

    // desktop: toca o vídeo só quando ele entra na viewport (IntersectionObserver), nunca no mount
    useEffect(() => {
        const el = videoRef.current;
        if (!el || !isDesktop) return;
        if (slides[current]?.type !== "video") return;

        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        el.play().catch(() => { });
                    } else {
                        el.pause();
                    }
                }
            },
            { threshold: 0.25 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [current, slides, isDesktop]);

    if (slides.length === 0) {
        return <section className="aspect-[4/5] w-full bg-gray-100 md:aspect-video" />;
    }

    const slide = slides[current];

    const renderMedia = () => {
        if (slide.type === "image") {
            const isFirst = current === 0;
            // mobile é obrigatório; desktop opcional → se faltar, cai pro mobile
            const mobileSrc = slide.srcMobile || slide.src;
            const desktopSrc = slide.src || slide.srcMobile || mobileSrc;
            // <picture>/media: só a imagem certa por largura é baixada (não CSS escondendo)
            // container 4:5 no mobile / 16:9 no desktop: bate com o que a tela de
            // upload manda exportar (1080×1350 mobile, 1920×1080 desktop) → object-cover
            // so apara a beirada, nao corta a cabeca.
            return (
                <div className="aspect-[4/5] w-full md:aspect-video">
                    <picture className="block h-full w-full">
                        <source media="(min-width: 768px)" srcSet={desktopSrc} />
                        <img
                            src={mobileSrc}
                            alt={slide.alt}
                            className="h-full w-full object-cover"
                            loading={isFirst ? "eager" : "lazy"}
                            fetchPriority={isFirst ? "high" : "auto"}
                            decoding={isFirst ? "auto" : "async"}
                        />
                    </picture>
                </div>
            );
        }

        // slide de vídeo no MOBILE (<768px): só o poster, sem <video> no DOM (não baixa o vídeo)
        if (!isDesktop) {
            return (
                <div className="aspect-[4/5] w-full">
                    {slide.poster ? (
                        <img
                            src={slide.poster}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : null}
                </div>
            );
        }

        // slide de vídeo no DESKTOP: preload="none" + poster; play só via IntersectionObserver
        return (
            <div className="aspect-video w-full">
                <video
                    ref={videoRef}
                    src={slide.src}
                    poster={slide.poster || undefined}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    loop={false}
                    preload="none"
                />
            </div>
        );
    };

    return (
        <section className="relative w-full overflow-hidden bg-black">
            <div
                className={`transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"
                    }`}
            >
                {renderMedia()}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-black/30" />

            {slide.cta && (
                <div className="absolute inset-0 flex items-end justify-center px-4 pb-6 sm:pb-10 md:pb-16">
                    <a
                        href={slide.cta.href}
                        className="max-w-full whitespace-normal bg-white px-4 py-3 text-center text-sm font-semibold tracking-widest text-black transition-colors duration-300 hover:bg-black hover:text-white sm:px-8"
                    >
                        {slide.cta.text}
                    </a>
                </div>
            )}

            <button
                onClick={prev}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/50"
                aria-label="Anterior"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/50"
                aria-label="Próximo"
            >
                <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {slides.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-white" : "w-2 bg-white/50"
                            }`}
                        aria-label={`Slide ${i + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
