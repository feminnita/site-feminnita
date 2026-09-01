"use client";

import { ProductCard } from "../../components/product/ProductCard";
import { fetchProducts } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";
import { useEffect, useState } from "react";

type Props = {
    productId: string;
    categoryId?: string | null;
};

export function SimilarProducts({ productId, categoryId }: Props) {
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) return;

        // backend já entrega só os 6 (por categoria, mais vendidos, excluindo o atual,
        // com fallback pra categoria pai) — nada de baixar o catálogo inteiro no cliente
        fetchProducts({
            categoryId: categoryId ?? undefined,
            exclude: productId,
            limit: 6,
        })
            .then((list) => {
                setProducts(list);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [productId, categoryId]);

    if (loading) {
        return (
            <div className="mt-16">
                <div className="mb-8 h-6 w-64 animate-pulse rounded bg-gray-200" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="aspect-square animate-pulse rounded bg-gray-200" />
                            <div className="h-3 animate-pulse rounded bg-gray-200" />
                            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!products.length) return null;

    return (
        <section className="mt-16">
            <h2 className="mb-8 text-2xl font-light">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
