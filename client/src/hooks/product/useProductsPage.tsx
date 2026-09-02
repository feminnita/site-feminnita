"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MAX_PRICE, filterProducts, sortProducts } from "../../utils/catalog";
import { groupSizes } from "../../utils/sizes";
import { fetchProducts } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";
import type {
    CatalogFacets,
    ProductFilters,
    SortOption,
} from "../../types/catalog/catalog";

// Vitrine /produtos. Categoria e Cor NÃO filtram aqui (categoria vive no menu;
// cor tem milhares de valores). Estado na URL: ?q=&tamanho=&precoMax=&ordem=.
export function useProductsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const getParam = (key: string, fallback = "") =>
        searchParams.get(key) || fallback;
    const getArray = (key: string) => {
        const v = searchParams.get(key);
        return v ? v.split(",").filter(Boolean) : [];
    };

    const [query, setQuery] = useState(getParam("q"));
    const [sizes, setSizes] = useState<string[]>(getArray("tamanho"));
    const [maxPrice, setMaxPrice] = useState(
        Number(getParam("precoMax", String(MAX_PRICE))),
    );
    const [sort, setSort] = useState<SortOption>(
        getParam("ordem", "relevance") as SortOption,
    );
    const [loading, setLoading] = useState(true);
    const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
    const [results, setResults] = useState<StoreProduct[]>([]);

    useEffect(() => {
        fetchProducts().then((products) => setAllProducts(products));
    }, []);

    // Reflete a URL quando a busca do header muda enquanto já estamos em /produtos.
    useEffect(() => {
        setQuery(searchParams.get("q") || "");
    }, [searchParams]);

    // Tamanhos agrupados case-insensitive e em ordem de vestuário (groupSizes).
    const availableSizes = groupSizes(allProducts.flatMap((p) => p.sizes));

    const facets: CatalogFacets = {
        colors: [],
        categories: [],
        sizes: availableSizes,
    };

    const pushParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            Object.entries(updates).forEach(([k, v]) => {
                if (v && v !== "relevance" && v !== String(MAX_PRICE)) params.set(k, v);
                else params.delete(k);
            });
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname],
    );

    useEffect(() => {
        pushParams({
            q: query,
            tamanho: sizes.join(","),
            precoMax: String(maxPrice),
            ordem: sort,
        });
    }, [query, sizes, maxPrice, sort]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            const filters: ProductFilters = {
                query,
                category: "all",
                colors: [],
                sizes,
                maxPrice,
                sort,
            };
            const filtered = filterProducts(allProducts, filters, facets);
            setResults(sortProducts(filtered, sort));
            setLoading(false);
        }, 200);
        return () => clearTimeout(timer);
    }, [query, sizes, maxPrice, sort, allProducts]);

    const toggleSize = (size: string) =>
        setSizes((prev) =>
            prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
        );

    const clearAll = () => {
        setQuery("");
        setSizes([]);
        setMaxPrice(MAX_PRICE);
        setSort("relevance");
    };

    const activeCount = sizes.length + (maxPrice < MAX_PRICE ? 1 : 0);

    return {
        query,
        setQuery,
        sizes,
        toggleSize,
        maxPrice,
        setMaxPrice,
        sort,
        setSort,
        loading,
        results,
        availableSizes,
        activeCount,
        clearAll,
        maxPriceLimit: MAX_PRICE,
    };
}
