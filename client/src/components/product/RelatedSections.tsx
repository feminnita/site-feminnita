"use client";

import { useEffect, useState } from "react";
import { ProductCarousel } from "./ProductCarousel";
import { fetchProducts } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";

type Props = {
    productId: string;
    categoryId?: string | null;
};

// Monta os DOIS carrosséis do produto a partir de UMA busca (fetchProducts),
// garantindo que "Complete seu pedido" e "Você também pode gostar" NUNCA
// mostram a mesma peça (exclusão por id).
export function RelatedSections({ productId, categoryId }: Props) {
    const [complete, setComplete] = useState<StoreProduct[]>([]);
    const [alsoLike, setAlsoLike] = useState<StoreProduct[]>([]);
    const [novelties, setNovelties] = useState<StoreProduct[]>([]);

    useEffect(() => {
        if (!productId) return;
        let cancelled = false;

        fetchProducts()
            .then((all) => {
                if (cancelled) return;

                // Pool elegível: ativo, com foto, com estoque e diferente do atual.
                const pool = all.filter(
                    (p) =>
                        p.id !== productId &&
                        p.active !== false &&
                        (p.images?.length ?? 0) > 0 &&
                        p.stock > 0,
                );

                // "Complete seu pedido": categorias DIFERENTES da atual, diversificando
                // por category_id (round-robin) pra não vir 6 da mesma categoria.
                const others = pool.filter((p) => p.category_id !== categoryId);
                const byCategory = new Map<string, StoreProduct[]>();
                for (const p of others) {
                    const key = p.category_id ?? "__none__";
                    if (!byCategory.has(key)) byCategory.set(key, []);
                    byCategory.get(key)!.push(p);
                }
                const buckets = [...byCategory.values()];
                const completeSel: StoreProduct[] = [];
                let idx = 0;
                while (completeSel.length < 6 && buckets.some((b) => b.length > 0)) {
                    const bucket = buckets[idx % buckets.length];
                    const next = bucket.shift();
                    if (next) completeSel.push(next);
                    idx++;
                }
                const completeIds = new Set(completeSel.map((p) => p.id));

                // "Você também pode gostar": MESMA categoria, outros modelos,
                // excluindo tudo que já entrou em "Complete seu pedido".
                const alsoLikeSel = pool
                    .filter(
                        (p) => p.category_id === categoryId && !completeIds.has(p.id),
                    )
                    .slice(0, 6);
                const alsoLikeIds = new Set(alsoLikeSel.map((p) => p.id));

                // "Novidades": lançamentos (isNew), excluindo o atual e tudo que já
                // apareceu nos dois carrosséis acima (sem overlap entre os três).
                const noveltiesSel = pool
                    .filter(
                        (p) =>
                            p.isNew &&
                            !completeIds.has(p.id) &&
                            !alsoLikeIds.has(p.id),
                    )
                    .slice(0, 6);

                setComplete(completeSel);
                setAlsoLike(alsoLikeSel);
                setNovelties(noveltiesSel);
            })
            .catch(() => {
                if (cancelled) return;
                setComplete([]);
                setAlsoLike([]);
                setNovelties([]);
            });

        return () => {
            cancelled = true;
        };
    }, [productId, categoryId]);

    return (
        <>
            <ProductCarousel title="Complete seu pedido" products={complete} />
            <ProductCarousel title="Você também pode gostar" products={alsoLike} />
            <ProductCarousel title="Novidades" products={novelties} />
        </>
    );
}
