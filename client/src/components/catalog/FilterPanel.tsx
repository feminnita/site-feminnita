"use client";

import type { PropsFilterPanel } from "../../types/catalog/catalog";
import { CategoryFilterAccordion } from "../catalog/FilterAccordion";

export function FilterPanel({
    categoryTree,
    category,
    onCategoryChange,
    availableSizes,
    sizes,
    onToggleSize,
    maxPrice,
    maxPriceLimit,
    onMaxPriceChange,
    activeCount,
    onClearAll,
}: PropsFilterPanel) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtros</h3>
                {activeCount > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-[#8C2F39] hover:underline"
                    >
                        Limpar tudo
                    </button>
                )}
            </div>

            {categoryTree.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Categoria
                    </p>
                    <button
                        onClick={() => onCategoryChange("all")}
                        className={`mb-1 w-full rounded-lg px-2 py-2 text-left text-sm transition-colors ${category === "all"
                                ? "bg-[#8C2F39] text-white"
                                : "hover:bg-gray-100"
                            }`}
                    >
                        Todos
                    </button>
                    <CategoryFilterAccordion
                        items={categoryTree}
                        selectedCategory={category}
                        onSelect={onCategoryChange}
                    />
                </div>
            )}

            {availableSizes.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Tamanho
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {availableSizes.map((s) => (
                            <button
                                key={s}
                                onClick={() => onToggleSize(s)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${sizes.includes(s)
                                        ? "border-[#8C2F39] bg-[#8C2F39] text-white"
                                        : "border-gray-300 hover:border-[#8C2F39]"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Preço máximo — R$ {maxPrice}
                </p>
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
        </div>
    );
}
