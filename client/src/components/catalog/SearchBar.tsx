"use client";

import { Search, X } from "lucide-react";
import type { PropsSearchBar } from "../../types/catalog/catalog";

export function SearchBar({ query, onChange }: PropsSearchBar) {
    return (
        <div className="relative mb-3">
            <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder='Busca inteligente — ex: "legging preta M" ou "conjunto rose"'
                className="w-full rounded-xl border bg-[#FAF6F2] py-3.5 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
            />
            {query && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
