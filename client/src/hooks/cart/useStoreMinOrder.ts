"use client";

import { useEffect, useState } from "react";
import { fetchStoreMinOrder, type StoreMinOrder } from "../../services/settingsService";

// Lê a chave `store_min_order` do painel (sem cache) para efeito imediato.
// Enquanto carrega, assume o default (ativo=true, valor=199) para não liberar
// o checkout antes de saber a regra real.
export function useStoreMinOrder(): { minOrder: StoreMinOrder; loading: boolean } {
    const [minOrder, setMinOrder] = useState<StoreMinOrder>({ ativo: true, valor: 199 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetchStoreMinOrder()
            .then((value) => {
                if (!cancelled) setMinOrder(value);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return { minOrder, loading };
}
