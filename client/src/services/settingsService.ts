import { apiGet, API_URL } from "./api";

export async function fetchSettings(): Promise<Record<string, any> | null> {
    return apiGet<Record<string, any>>("/api/store/settings");
}

export type StoreMinOrder = { ativo: boolean; valor: number };

// Default quando a chave `store_min_order` não existe: ativo=true, valor=199.
const DEFAULT_MIN_ORDER: StoreMinOrder = { ativo: true, valor: 199 };

// Busca a chave `store_min_order` sem cache (cache: 'no-store') para refletir
// mudanças do painel imediatamente, sem deploy.
export async function fetchStoreMinOrder(): Promise<StoreMinOrder> {
    try {
        const response = await fetch(`${API_URL}/api/store/settings`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!response.ok) return DEFAULT_MIN_ORDER;

        const settings = (await response.json()) as Record<string, any> | null;
        const raw = settings?.store_min_order as { ativo?: boolean; valor?: number } | undefined;
        if (!raw) return DEFAULT_MIN_ORDER;

        return {
            ativo: raw.ativo ?? DEFAULT_MIN_ORDER.ativo,
            valor: typeof raw.valor === "number" ? raw.valor : DEFAULT_MIN_ORDER.valor,
        };
    } catch {
        return DEFAULT_MIN_ORDER;
    }
}
