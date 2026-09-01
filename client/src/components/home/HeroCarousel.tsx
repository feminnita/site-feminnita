"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "../../types/banners/banners";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HeroCarousel({ slides }: { slides: Slide[] }) {
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
        if (slides.length === 0) return;
        const slide = slides[current];

        if (slide.type === "video" && videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.error(error);
            });
        }

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

    if (slides.length === 0) {
        return <section className="h-[300px] bg-gray-100" />;
    }

    const slide = slides[current];
    return (
        <section className="relative w-full overflow-hidden bg-black">
            <div
                className={`transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"
                    }`}
            >
                {slide.type === "image" ? (
                    <img
                        src={slide.src}
                        alt={slide.alt}
                        className="block h-auto w-full"
                    />
                ) : (
                    <div className="aspect-video w-full">
                        <video
                            ref={videoRef}
                            src={slide.src}
                            poster={slide.poster || undefined}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            loop={false}
                        />
                    </div>
                )}
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
