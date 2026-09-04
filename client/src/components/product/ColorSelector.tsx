"use client";

import { useEffect, useState } from "react";
import { ImageOff, X } from "lucide-react";
import type { ColorSelectorProps } from "@/src/types/product/products";
import type { ColorSwatch } from "@/src/types/colors/colors";
import { normalizeColorKey } from "@/src/utils/product";

const VISIBLE_LIMIT = 8;

function swatchPhoto(swatches: ColorSwatch[], color: string): string | null {
    const target = normalizeColorKey(color);
    const match = swatches.find((s) => normalizeColorKey(s.name) === target);
    const url = match?.imageUrl?.trim();
    return url ? url : null;
}

type ThumbProps = {
    color: string;
    photo: string | null;
    isSelected: boolean;
    onSelect: (color: string) => void;
};

// Miniatura da estampa: foto (se houver) ou placeholder neutro — NUNCA quadrado
// cinza quebrado. O NOME fica sempre embaixo (a compradora pede por nome no WhatsApp).
function EstampaThumb({ color, photo, isSelected, onSelect }: ThumbProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect(color)}
            aria-pressed={isSelected}
            aria-label={`Estampa ${color}`}
            title={color}
            className="group flex flex-col items-center gap-1 text-center"
        >
            <span
                className={`relative block aspect-[3/4] w-full overflow-hidden rounded-md border-2 bg-gray-50 transition-all ${isSelected
                        ? "border-[#8C2F39] ring-2 ring-[#8C2F39] ring-offset-1"
                        : "border-gray-200 group-hover:border-gray-400"
                    }`}
            >
                {photo ? (
                    <img
                        src={photo}
                        alt={color}
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-gray-50 to-gray-100 px-1 text-gray-400">
                        <ImageOff size={18} />
                        <span className="text-[10px] leading-tight">sem foto</span>
                    </span>
                )}
            </span>
            <span
                className={`line-clamp-2 w-full text-xs leading-tight ${isSelected ? "font-semibold text-[#8C2F39]" : "text-gray-600"
                    }`}
            >
                {color}
            </span>
        </button>
    );
}

export function ColorSelector({
    colors,
    selectedColor,
    onSelect,
    swatches,
}: ColorSelectorProps) {
    const [expanded, setExpanded] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Trava o scroll do body enquanto o modal fullscreen (mobile) estiver aberto.
    useEffect(() => {
        if (!modalOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [modalOpen]);

    if (colors.length === 0) return null;

    const hasMore = colors.length > VISIBLE_LIMIT;
    const visibleColors =
        hasMore && !expanded ? colors.slice(0, VISIBLE_LIMIT) : colors;

    const select = (color: string) => {
        onSelect(color);
        setModalOpen(false);
    };

    const openAll = () => {
        if (isMobile) setModalOpen(true);
        else setExpanded(true);
    };

    return (
        <div>
            <label className="mb-3 block text-sm font-medium">
                Estampa:{" "}
                <span className="font-normal text-gray-600">{selectedColor}</span>
            </label>

            {/* Grade de miniaturas. Ao expandir no desktop, rola por dentro (max-height)
                para NUNCA empurrar preço/botão de comprar pra fora da tela. */}
            <div
                className={`grid grid-cols-4 gap-3 ${expanded ? "max-h-[380px] overflow-y-auto pr-1" : ""
                    }`}
            >
                {visibleColors.map((color) => (
                    <EstampaThumb
                        key={color}
                        color={color}
                        photo={swatchPhoto(swatches, color)}
                        isSelected={selectedColor === color}
                        onSelect={select}
                    />
                ))}
            </div>

            {hasMore && !expanded && (
                <button
                    type="button"
                    onClick={openAll}
                    className="mt-3 w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#8C2F39] hover:text-[#8C2F39]"
                >
                    Ver todas as estampas ({colors.length})
                </button>
            )}

            {hasMore && expanded && !isMobile && (
                <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="mt-3 w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#8C2F39] hover:text-[#8C2F39]"
                >
                    Ver menos
                </button>
            )}

            {/* Mobile: "Ver todas" abre em tela cheia (modal fullscreen). */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-base font-medium">
                            Estampas ({colors.length})
                        </h2>
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            aria-label="Fechar"
                            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                        >
                            <X size={22} />
                        </button>
                    </div>
                    <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4">
                        {colors.map((color) => (
                            <EstampaThumb
                                key={color}
                                color={color}
                                photo={swatchPhoto(swatches, color)}
                                isSelected={selectedColor === color}
                                onSelect={select}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
