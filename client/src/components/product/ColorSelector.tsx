"use client";

import { useEffect, useState } from "react";
import { ImageOff, X } from "lucide-react";
import type { ColorSelectorProps } from "@/src/types/product/products";
import type { ColorSwatch } from "@/src/types/colors/colors";
import { normalizeColorKey } from "@/src/utils/product";

const VISIBLE_LIMIT = 8;

// Cascata da miniatura (na ordem que a cliente pediu):
// 1) colorImages[cor] → FOTO DA MODELO vestindo a estampa (clicar troca a foto grande)
// 2) senão, swatch.imageUrl → TECIDO (fallback; clicar só marca e mantém as capas)
// 3) senão → placeholder "sem foto" com o nome
// Cada estampa "sobe de nível" conforme a Chris preenche a foto da modelo ao longo das semanas.
function resolveThumb(
    colorImages: Record<string, string[]> | undefined,
    swatches: ColorSwatch[],
    color: string,
): string | null {
    const target = normalizeColorKey(color);
    if (colorImages) {
        const key = Object.keys(colorImages).find((k) => normalizeColorKey(k) === target);
        const modelo = key ? colorImages[key]?.[0]?.trim() : undefined;
        if (modelo) return modelo;
    }
    const match = swatches.find((s) => normalizeColorKey(s.name) === target);
    const tecido = match?.imageUrl?.trim();
    return tecido ? tecido : null;
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
            className="group flex w-[72px] flex-col items-center gap-1 text-center"
        >
            <span
                className={`relative block h-[72px] w-[72px] overflow-hidden rounded-md border-2 bg-gray-50 transition-all ${isSelected
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
                    <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-gray-50 to-gray-100 px-1 text-gray-400">
                        <ImageOff size={16} />
                        <span className="text-[9px] leading-tight">sem foto</span>
                    </span>
                )}
            </span>
            <span
                className={`line-clamp-2 w-full text-[11px] leading-tight ${isSelected ? "font-semibold text-[#8C2F39]" : "text-gray-600"
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
    colorImages,
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
                className={`flex flex-wrap gap-3 ${expanded ? "max-h-[380px] overflow-y-auto pr-1" : ""
                    }`}
            >
                {visibleColors.map((color) => (
                    <EstampaThumb
                        key={color}
                        color={color}
                        photo={resolveThumb(colorImages, swatches, color)}
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
                    <div className="flex flex-1 flex-wrap content-start gap-3 overflow-y-auto p-4">
                        {colors.map((color) => (
                            <EstampaThumb
                                key={color}
                                color={color}
                                photo={resolveThumb(colorImages, swatches, color)}
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
