"use client";

import type { SkuStock, SelectedProduct } from "../../types/product/products";

export function StockIndicator({ skus, selectedSize, selectedColor }: SelectedProduct) {
    if (skus.length === 0 || !selectedSize) return null;

    const current = skus.find((s) => {
        const sizeMatch = s.size === selectedSize;
        const colorMatch =
            !selectedColor ||
            !s.color ||
            s.color.toLowerCase() === selectedColor.toLowerCase();
        return sizeMatch && colorMatch;
    });

    if (!current || current.stockStatus === "out_of_stock") {
        return (
            <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-red-600">
                    Esgotado neste tamanho
                </span>
            </div>
        );
    }

    if (current.stockStatus === "low_stock") {
        return (
            <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-amber-600">
                    Últimas {current.availableQty} unidade
                    {current.availableQty !== 1 ? "s" : ""}!
                </span>
            </div>
        );
    }

    return (
        <div className="mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600">Em estoque</span>
        </div>
    );
}
