"use client";

import { Check, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../hooks/cart/useCart";
import { fetchSuggestions } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";

const brl = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

function QuickAddCard({ product }: { product: StoreProduct }) {
    const { add } = useCart();
    const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
    const [added, setAdded] = useState(false);

    // Cor é escolhida na página do produto; no quick-add usamos a primeira cor.
    const defaultColor = product.colors[0] ?? "";

    const handleAdd = () => {
        add({
            ...product,
            selectedColor: defaultColor,
            selectedSize,
            quantity: 1,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <div className="flex w-40 shrink-0 flex-col gap-2 rounded-lg border bg-white p-2">
            <div className="relative aspect-[2/3] overflow-hidden rounded bg-gray-100">
                <Image
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                />
            </div>
            <h4 className="line-clamp-2 min-h-[2rem] text-xs font-medium">{product.name}</h4>
            <p className="text-sm font-semibold">{brl(product.price)}</p>

            {product.sizes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {product.sizes.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`h-7 min-w-[1.75rem] rounded border px-1.5 text-xs font-medium transition-all ${selectedSize === size
                                ? "border-black bg-black text-white"
                                : "border-gray-300 hover:border-gray-500"
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={handleAdd}
                className={`mt-1 flex w-full items-center justify-center gap-1 rounded-md py-2 text-xs font-medium transition-colors ${added ? "bg-green-600 text-white" : "bg-[#8C2F39] text-[#FAF6F2] hover:bg-[#7a2832]"
                    }`}
            >
                {added ? <Check size={14} /> : <Plus size={14} />}
                {added ? "Adicionado" : "Adicionar"}
            </button>
        </div>
    );
}

export function CompleteOrderStrip({ excludeIds }: { excludeIds: string[] }) {
    const [suggestions, setSuggestions] = useState<StoreProduct[]>([]);

    const excludeKey = useMemo(() => [...excludeIds].sort().join(","), [excludeIds]);

    useEffect(() => {
        let cancelled = false;
        fetchSuggestions(excludeKey ? excludeKey.split(",") : [], 6)
            .then((products) => {
                if (!cancelled) setSuggestions(products);
            })
            .catch(() => {
                if (!cancelled) setSuggestions([]);
            });
        return () => {
            cancelled = true;
        };
    }, [excludeKey]);

    if (suggestions.length === 0) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium">Complete seu pedido</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {suggestions.map((product) => (
                    <QuickAddCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
