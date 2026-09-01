"use client";

import { SUGGESTIONS } from "../../utils/catalog";
import type { PropsSuggestionsChips } from "../../types/catalog/catalog";

export function SuggestionChips({ visible, onSelect }: PropsSuggestionsChips) {
    if (!visible) return null;

    return (
        <div className="mb-5 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
                <button
                    key={s}
                    onClick={() => onSelect(s)}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs transition-colors hover:bg-[#FAF6F2] hover:text-[#8C2F39]"
                >
                    {s}
                </button>
            ))}
        </div>
    );
}
