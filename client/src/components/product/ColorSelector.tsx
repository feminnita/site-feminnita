"use client";

import { ColorCarousel } from "@/src/components/product/ColorCarousel";
import type { ColorSelectorProps } from "@/src/types/product/products";

export function ColorSelector({
    colors,
    selectedColor,
    onSelect,
    swatches,
}: ColorSelectorProps) {
    if (colors.length === 0) return null;

    return (
        <div className="flex flex-col items-center text-center">
            <label className="mb-3 block text-sm font-medium">
                Cor: <span className="font-normal text-gray-600">{selectedColor}</span>
            </label>
            <div className="w-full max-w-md">
                <ColorCarousel
                    colors={colors}
                    selectedColor={selectedColor}
                    onSelect={onSelect}
                    swatches={swatches}
                    size="lg"
                />
            </div>
        </div>
    );
}
