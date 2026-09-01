"use client";

import { StockIndicator } from "../../components/product/StockIndicador";
import type { SizeSelectorProps } from "@/src/types/product/products";

export function SizeSelector({
    productId,
    sizes,
    selectedSize,
    selectedColor,
    skus,
    onSelect,
}: SizeSelectorProps) {
    const isSizeAvailable = (size: string): boolean => {
        if (skus.length === 0) return true;

        const sku = skus.find((s) => {
            const sizeMatch = s.size === size;
            const colorMatch =
                !selectedColor ||
                !s.color ||
                s.color.toLowerCase() === selectedColor.toLowerCase();
            return sizeMatch && colorMatch;
        });

        return Boolean(sku && sku.availableQty > 0);
    };

    return (
        <div>
            <label className="mb-3 block text-sm font-medium">
                Tamanho:{" "}
                {selectedSize && (
                    <span className="font-normal text-gray-600">{selectedSize}</span>
                )}
            </label>
            <div className="mb-3 flex flex-wrap gap-3">
                {sizes.map((size) => {
                    const available = isSizeAvailable(size);

                    return (
                        <button
                            key={size}
                            onClick={() => available && onSelect(size)}
                            disabled={!available}
                            className={`rounded-lg border-2 px-6 py-3 font-medium transition-all ${selectedSize === size
                                    ? "border-black bg-black text-white"
                                    : available
                                        ? "border-gray-300 hover:border-gray-400"
                                        : "cursor-not-allowed border-gray-200 text-gray-300 line-through"
                                }`}
                        >
                            {size}
                        </button>
                    );
                })}
            </div>
            <StockIndicator
                skus={skus}
                selectedSize={selectedSize}
                selectedColor={selectedColor}
            />
        </div>
    );
}
