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
        return <section className="aspect-[4/5] w-full bg-gray-100 md:aspect-[12/5] md:max-h-[720px]" />;
    }

    const slide = slides[current];

    // textPosition (ex. "bottom-center") → classes flex de alinhamento do bloco de texto
    const overlayAlign = (pos?: string | null) => {
        const [v, h] = (pos || "center-center").split("-");
        const vClass =
            v === "top" ? "items-start" : v === "bottom" ? "items-end" : "items-center";
        const hClass =
            h === "left" ? "justify-start" : h === "right" ? "justify-end" : "justify-center";
        return `${vClass} ${hClass}`;
    };

    // gradiente DIRECIONAL só do lado do texto (não escurece a arte toda).
    // direção vem do textPosition; cor vem do textTheme (light=preto / dark=branco).
    const gradientFor = (pos?: string | null, theme?: string | null) => {
        const c = theme === "dark" ? "255,255,255" : "0,0,0";
        const [v, h] = (pos || "center-center").split("-");
        let dir: string;
        if (h === "left") dir = "to right";
        else if (h === "right") dir = "to left";
        else if (v === "top") dir = "to bottom";
        else dir = "to top"; // bottom, centro-centro e mobile
        // light + texto na base: banner claro (perna da modelo) exige scrim mais forte
        if (dir === "to top" && c === "0,0,0") {
            return `linear-gradient(to top, rgba(0,0,0,.68), rgba(0,0,0,.28) 22%, transparent 40%)`;
        }
        return `linear-gradient(${dir}, rgba(${c},.55), rgba(${c},.15) 45%, transparent 70%)`;
    };

    // posição/tema por breakpoint: mobile usa o seu valor; se vazio, cai no desktop
    const pos = isDesktop
        ? slide.textPosition
        : slide.textPositionMobile || slide.textPosition;
    const themeSource = isDesktop
        ? slide.textTheme
        : slide.textThemeMobile || slide.textTheme;

    // light = texto branco (gradiente escuro) · dark = texto escuro (gradiente branco)
    const textTheme = themeSource === "dark" ? "dark" : "light";
    const textColor = textTheme === "dark" ? "#1c1512" : "#ffffff";
    const textShadow =
        textTheme === "dark"
            ? "0 1px 3px rgba(255,255,255,.5)"
            : "0 1px 3px rgba(0,0,0,.45)";

    const renderMedia = () => {
        if (slide.type === "image") {
            const isFirst = current === 0;
            // mobile é obrigatório; desktop opcional → se faltar, cai pro mobile
            const mobileSrc = slide.srcMobile || slide.src;
            const desktopSrc = slide.src || slide.srcMobile || mobileSrc;
            // <picture>/media: só a imagem certa por largura é baixada (não CSS escondendo)
            // container 4:5 no mobile / 12:5 no desktop (max 720px): object-cover apara a
            // beirada e o objectPosition (ponto focal) decide o que fica no corte.
            return (
                <div className="aspect-[4/5] w-full md:aspect-[12/5] md:max-h-[720px]">
                    <picture className="block h-full w-full">
                        <source media="(min-width: 768px)" srcSet={desktopSrc} />
                        <img
                            src={mobileSrc}
                            alt={slide.alt}
                            className="h-full w-full object-cover"
                            style={{ objectPosition: slide.focal || "center" }}
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
                <div className="aspect-[4/5] w-full md:aspect-[12/5] md:max-h-[720px]">
                    {slide.poster ? (
                        <img
                            src={slide.poster}
                            alt=""
                            className="h-full w-full object-cover"
                            style={{ objectPosition: slide.focal || "center" }}
                        />
                    ) : null}
                </div>
            );
        }

        // slide de vídeo no DESKTOP: preload="none" + poster; play só via IntersectionObserver
        return (
            <div className="aspect-[4/5] w-full md:aspect-[12/5] md:max-h-[720px]">
                <video
                    ref={videoRef}
                    src={slide.src}
                    poster={slide.poster || undefined}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: slide.focal || "center" }}
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

            {(slide.title || slide.subtitle || slide.cta) && (
                <>
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ background: gradientFor(pos, textTheme) }}
                    />
                    <div
                        className={`pointer-events-none absolute inset-0 flex ${overlayAlign(
                            pos,
                        )} p-6 sm:p-10 md:p-16`}
                    >
                        <div className="pointer-events-auto max-w-2xl text-center">
                            {slide.title && (
                                <h2
                                    className="text-2xl font-bold leading-tight sm:text-3xl md:text-5xl"
                                    style={{ color: textColor, textShadow }}
                                >
                                    {slide.title}
                                </h2>
                            )}
                            {slide.subtitle && (
                                <p
                                    className="mt-2 text-sm sm:text-base md:text-lg"
                                    style={{ color: textColor, textShadow }}
                                >
                                    {slide.subtitle}
                                </p>
                            )}
                            {slide.cta && (
                                <a
                                    href={slide.cta.href}
                                    className="mt-4 inline-block max-w-full whitespace-normal rounded-md bg-[#8C2F39] px-4 py-3 text-center text-sm font-semibold tracking-widest text-white shadow-md transition-colors duration-300 hover:bg-[#7a2832] sm:px-8"
                                >
                                    {slide.cta.text}
                                </a>
                            )}
                        </div>
                    </div>
                </>
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
