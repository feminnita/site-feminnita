"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ColorSelectorProps } from "@/src/types/product/products";
import { normalizeColorKey } from "@/src/utils/product";

const VISIBLE_LIMIT = 8;

// Cascata da miniatura — 2 NÍVEIS SÓ (a dona vetou o retalho de tecido na loja):
// 1) colorImages[cor] → FOTO DA MODELO vestindo a estampa (clicar troca a foto grande)
// 2) senão → CHIP DE TEXTO só com o nome (estilo seletor de cor Zara/COS)
// Cada estampa "sobe de nível" (vira foto) conforme a Chris preenche a foto da modelo.
function resolveThumb(
    colorImages: Record<string, string[]> | undefined,
    color: string,
): string | null {
    if (!colorImages) return null;
    const target = normalizeColorKey(color);
    const key = Object.keys(colorImages).find((k) => normalizeColorKey(k) === target);
    const modelo = key ? colorImages[key]?.[0]?.trim() : undefined;
    return modelo ? modelo : null;
}

type ThumbProps = {
    color: string;
    photo: string | null;
    isSelected: boolean;
    onSelect: (color: string) => void;
};

// Estampa COM foto: miniatura 72px quadrada, object-cover, nome embaixo.
// Estampa SEM foto: chip de texto (pílula com borda fina, nome centralizado) — NUNCA
// quadrado cinza, placeholder ou texto "sem foto". A compradora pede por nome no WhatsApp.
function EstampaThumb({ color, photo, isSelected, onSelect }: ThumbProps) {
    if (!photo) {
        return (
            <button
                type="button"
                onClick={() => onSelect(color)}
                aria-pressed={isSelected}
                aria-label={`Estampa ${color}`}
                title={color}
                className={`flex min-h-[40px] min-w-[72px] max-w-[160px] items-center justify-center rounded-full border px-4 py-2 text-center text-[12px] leading-tight transition-all ${isSelected
                        ? "border-[#8C2F39] bg-[#8C2F39]/5 font-semibold text-[#8C2F39] ring-1 ring-[#8C2F39]"
                        : "border-gray-300 text-gray-700 hover:border-gray-500"
                    }`}
            >
                {color}
            </button>
        );
    }

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
                <img
                    src={photo}
                    alt={color}
                    loading="lazy"
                    className="h-full w-full object-cover"
                />
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
                className={`flex flex-wrap items-start gap-3 ${expanded ? "max-h-[380px] overflow-y-auto pr-1" : ""
                    }`}
            >
                {visibleColors.map((color) => (
                    <EstampaThumb
                        key={color}
                        color={color}
                        photo={resolveThumb(colorImages, color)}
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
                    <div className="flex flex-1 flex-wrap content-start items-start gap-3 overflow-y-auto p-4">
                        {colors.map((color) => (
                            <EstampaThumb
                                key={color}
                                color={color}
                                photo={resolveThumb(colorImages, color)}
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
