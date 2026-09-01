"use client";

import type { SortOption, PropsToolbar } from "../../types/catalog/catalog";
import { SlidersHorizontal } from "lucide-react";

export function Toolbar({
    resultCount,
    activeCount,
    sort,
    onSortChange,
    onOpenFilters,
}: PropsToolbar) {
    return (
        <div className="mb-6 flex items-center gap-3">
            <button
                onClick={onOpenFilters}
                className="relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm lg:hidden"
            >
                <SlidersHorizontal size={16} />
                Filtros
                {activeCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8C2F39] text-[10px] text-white">
                        {activeCount}
                    </span>
                )}
            </button>

            <div className="flex-1" />

            <p className="hidden text-sm text-gray-500 sm:block">
                {resultCount} produto{resultCount !== 1 ? "s" : ""}
            </p>

            <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
            >
                <option value="relevance">Relevância</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="name">A-Z</option>
            </select>
        </div>
    );
}
