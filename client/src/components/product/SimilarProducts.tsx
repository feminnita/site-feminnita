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

        fetchProducts()
            .then((all) => {
                const similar = all
                    .filter(
                        (p) =>
                            p.id !== productId &&
                            (!categoryId || p.category_id === categoryId),
                    )
                    .slice(0, 6);
                setProducts(similar);
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
            <h2 className="mb-8 text-2xl font-light">Produtos similares</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
