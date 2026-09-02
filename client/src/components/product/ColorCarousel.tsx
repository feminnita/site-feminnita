"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ColorSwatch } from "@/src/types/colors/colors";

type Props = {
    colors: string[];
    selectedColor: string;
    onSelect: (color: string) => void;
    swatches: ColorSwatch[];
    size?: "sm" | "lg";
};

export function ColorCarousel({
    colors,
    selectedColor,
    onSelect,
    swatches,
    size = "sm",
}: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasOverflow, setHasOverflow] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const check = () => setHasOverflow(el.scrollWidth > el.clientWidth + 1);
        check();

        const observer = new ResizeObserver(check);
        observer.observe(el);

        return () => observer.disconnect();
    }, [colors.length]);

    if (colors.length === 0) return null;

    const scrollColors = (dir: number) => {
        scrollRef.current?.scrollBy({ left: dir * 120, behavior: "smooth" });
    };

    const circle = size === "lg" ? "h-11 w-11" : "h-8 w-8";
    const pill = size === "lg" ? "h-11 px-3 text-sm" : "h-8 px-2 text-xs";
    const selectedStyle =
        size === "lg"
            ? "scale-110 border-black ring-2 ring-black ring-offset-2"
            : "scale-110 border-black";
    const chevron = size === "lg" ? 18 : 16;

    return (
        <div className="flex w-full items-center gap-1">
            {hasOverflow && (
                <button
                    type="button"
                    onClick={() => scrollColors(-1)}
                    className="shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-700"
                    aria-label="Cores anteriores"
                >
                    <ChevronLeft size={chevron} />
                </button>
            )}
            <div
                ref={scrollRef}
                className={`flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${hasOverflow ? "" : "justify-center"
                    }`}
            >
                {colors.map((color) => {
                    const swatch = swatches.find(
                        (s) => s.name.toLowerCase() === color.toLowerCase(),
                    );
                    const hasPhoto = Boolean(swatch?.imageUrl?.trim());
                    const isSelected = selectedColor === color;

                    if (hasPhoto) {
                        return (
                            <button
                                key={color}
                                type="button"
                                onClick={() => onSelect(color)}
                                aria-label={`Cor ${color}`}
                                aria-pressed={isSelected}
                                className={`${circle} flex-shrink-0 overflow-hidden rounded-full border-2 transition-all ${isSelected
                                        ? selectedStyle
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                title={color}
                            >
                                <img
                                    src={swatch!.imageUrl}
                                    alt={color}
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onSelect(color)}
                            aria-label={`Cor ${color}`}
                            aria-pressed={isSelected}
                            className={`${pill} inline-flex flex-shrink-0 items-center justify-center whitespace-nowrap rounded-md border-2 font-medium leading-none transition-all ${isSelected
                                    ? selectedStyle
                                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                                }`}
                            title={color}
                        >
                            {color}
                        </button>
                    );
                })}
            </div>
            {hasOverflow && (
                <button
                    type="button"
                    onClick={() => scrollColors(1)}
                    className="shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-700"
                    aria-label="Próximas cores"
                >
                    <ChevronRight size={chevron} />
                </button>
            )}
        </div>
    );
}
