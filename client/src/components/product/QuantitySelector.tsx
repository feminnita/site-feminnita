"use client";

import type { QuantitySelectorProps } from "../../types/product/products";
import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
    quantity,
    onChange,
}: QuantitySelectorProps) {
    return (
        <div>
            <label className="mb-3 block text-sm font-medium">Quantidade</label>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => onChange(Math.max(1, quantity - 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-lg border-2 hover:bg-gray-100"
                >
                    <Minus size={20} />
                </button>
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                        onChange(Math.max(1, Number.parseInt(e.target.value) || 1))
                    }
                    className="h-12 w-20 rounded-lg border-2 text-center text-lg font-semibold"
                />
                <button
                    onClick={() => onChange(quantity + 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-lg border-2 hover:bg-gray-100"
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
}
