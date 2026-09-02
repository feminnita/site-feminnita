"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { SortOption } from "../../types/catalog/catalog";
import { MobileFilterSheet } from "./MobileFilterSheet";

type FilterBarProps = {
    availableSizes: string[];
    sizes: string[];
    onToggleSize: (size: string) => void;
    maxPrice: number;
    maxPriceLimit: number;
    onMaxPriceChange: (value: number) => void;
    sort: SortOption;
    onSortChange: (sort: SortOption) => void;
    resultCount: number;
    activeCount: number;
    onClearAll: () => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "relevance", label: "Relevância" },
    { value: "price-asc", label: "Menor preço" },
    { value: "price-desc", label: "Maior preço" },
    { value: "name", label: "A–Z" },
];

function sortLabel(sort: SortOption): string {
    return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Relevância";
}

// Dropdown desktop via <details> (toggle nativo, sem JS de clique-fora).
function Dropdown({
    label,
    active,
    children,
}: {
    label: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <details className="group/dd relative [&_summary::-webkit-details-marker]:hidden">
            <summary
                className={`flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                        ? "border-[#8C2F39] text-[#8C2F39]"
                        : "border-gray-300 hover:border-[#8C2F39]"
                }`}
            >
                {label}
                <ChevronDown
                    size={14}
                    className="text-gray-400 transition-transform group-open/dd:rotate-180"
                />
            </summary>
            <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
                {children}
            </div>
        </details>
    );
}

function SizeOptions({
    availableSizes,
    sizes,
    onToggleSize,
}: Pick<FilterBarProps, "availableSizes" | "sizes" | "onToggleSize">) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {availableSizes.map((s) => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onToggleSize(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        sizes.includes(s)
                            ? "border-[#8C2F39] bg-[#8C2F39] text-white"
                            : "border-gray-300 hover:border-[#8C2F39]"
                    }`}
                >
                    {s}
                </button>
            ))}
        </div>
    );
}

function PriceOptions({
    maxPrice,
    maxPriceLimit,
    onMaxPriceChange,
}: Pick<FilterBarProps, "maxPrice" | "maxPriceLimit" | "onMaxPriceChange">) {
    return (
        <div>
            <p className="mb-2 text-xs text-gray-500">Até R$ {maxPrice}</p>
            <input
                type="range"
                min={50}
                max={maxPriceLimit}
                step={10}
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                className="w-full accent-[#8C2F39]"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>R$ 50</span>
                <span>R$ {maxPriceLimit}</span>
            </div>
        </div>
    );
}

function SortOptions({
    sort,
    onSortChange,
}: Pick<FilterBarProps, "sort" | "onSortChange">) {
    return (
        <div className="space-y-1">
            {SORT_OPTIONS.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onSortChange(o.value)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sort === o.value
                            ? "bg-[#8C2F39] text-white"
                            : "hover:bg-gray-100"
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function FilterBar(props: FilterBarProps) {
    const {
        availableSizes,
        sizes,
        onToggleSize,
        maxPrice,
        maxPriceLimit,
        onMaxPriceChange,
        sort,
        onSortChange,
        resultCount,
        activeCount,
        onClearAll,
    } = props;

    const [sheetOpen, setSheetOpen] = useState(false);
    const sizeActive = sizes.length > 0;
    const priceActive = maxPrice < maxPriceLimit;

    return (
        <>
            <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-gray-100 bg-white/95 px-4 backdrop-blur">
                <div className="flex h-14 items-center gap-3">
                    {/* Desktop: dropdowns */}
                    <div className="hidden items-center gap-3 md:flex">
                        <Dropdown label="Tamanho" active={sizeActive}>
                            {availableSizes.length > 0 ? (
                                <SizeOptions
                                    availableSizes={availableSizes}
                                    sizes={sizes}
                                    onToggleSize={onToggleSize}
                                />
                            ) : (
                                <p className="text-xs text-gray-400">Sem tamanhos</p>
                            )}
                        </Dropdown>
                        <Dropdown label="Preço" active={priceActive}>
                            <PriceOptions
                                maxPrice={maxPrice}
                                maxPriceLimit={maxPriceLimit}
                                onMaxPriceChange={onMaxPriceChange}
                            />
                        </Dropdown>
                        <Dropdown label={`Ordenar por: ${sortLabel(sort)}`} active={false}>
                            <SortOptions sort={sort} onSortChange={onSortChange} />
                        </Dropdown>
                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={onClearAll}
                                className="text-xs text-[#8C2F39] hover:underline"
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Mobile: botão Filtrar */}
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        className="relative flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm md:hidden"
                    >
                        <SlidersHorizontal size={16} />
                        Filtrar
                        {activeCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8C2F39] text-[10px] text-white">
                                {activeCount}
                            </span>
                        )}
                    </button>

                    <div className="flex-1" />

                    <p className="whitespace-nowrap text-sm text-gray-500">
                        {resultCount} produto{resultCount !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Mobile: bottom-sheet com os mesmos controles */}
            <MobileFilterSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                resultCount={resultCount}
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Filtros</h3>
                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={onClearAll}
                                className="text-xs text-[#8C2F39] hover:underline"
                            >
                                Limpar tudo
                            </button>
                        )}
                    </div>
                    {availableSizes.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Tamanho
                            </p>
                            <SizeOptions
                                availableSizes={availableSizes}
                                sizes={sizes}
                                onToggleSize={onToggleSize}
                            />
                        </div>
                    )}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Preço máximo
                        </p>
                        <PriceOptions
                            maxPrice={maxPrice}
                            maxPriceLimit={maxPriceLimit}
                            onMaxPriceChange={onMaxPriceChange}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Ordenar por
                        </p>
                        <SortOptions sort={sort} onSortChange={onSortChange} />
                    </div>
                </div>
            </MobileFilterSheet>
        </>
    );
}
