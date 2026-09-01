import { apiGet, apiPost } from "./api";
import type { SkuStock, StoreProduct } from "../types/product/products";

export async function fetchProducts(options?: {
    featured?: boolean;
    category_slug?: string;
    limit?: number;
}): Promise<StoreProduct[]> {
    const params = new URLSearchParams();
    if (options?.featured) params.set("featured", "true");
    if (options?.category_slug) params.set("category", options.category_slug);
    if (options?.limit) params.set("limit", String(options.limit));

    return (await apiGet<StoreProduct[]>(`/api/store/products?${params}`)) ?? [];
}

export async function fetchProduct(idOrSlug: string): Promise<StoreProduct | null> {
    return apiGet<StoreProduct>(`/api/store/products/${idOrSlug}`);
}

export async function fetchProductStock(idOrSlug: string): Promise<SkuStock[]> {
    return (await apiGet<SkuStock[]>(`/api/store/products/${idOrSlug}/stock`)) ?? [];
}

export async function fetchSuggestions(
    excludeIds: string[] = [],
    limit = 6,
): Promise<StoreProduct[]> {
    const params = new URLSearchParams();
    if (excludeIds.length > 0) params.set("exclude", excludeIds.join(","));
    params.set("limit", String(limit));

    return (await apiGet<StoreProduct[]>(`/api/store/products/suggestions?${params}`)) ?? [];
}

export async function trackProductView(id: string): Promise<void> {
    await apiPost(`/api/store/products/${id}/view`).catch(() => { });
}