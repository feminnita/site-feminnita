"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    MAX_PRICE,
    countActiveFilters,
    filterProducts,
    sortProducts,
} from "../../utils/catalog";
import { buildTree, listGrandchildCategories } from "../../utils/categories";
import { fetchCategories } from "../../services/categoriesService";
import { fetchColorSwatches } from "../../services/colorsService";
import { fetchProducts } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";
import type { ColorSwatch } from "../../types/colors/colors";
import type {
    CategoryNode,
    CategoryRow,
} from "../../types/categories/categories";
import type {
    CatalogFacets,
    ProductFilters,
    SortOption,
} from "../../types/catalog/catalog";

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
    const [category, setCategory] = useState(getParam("cat", "all"));
    const [colors, setColors] = useState<string[]>(getArray("cores"));
    const [sizes, setSizes] = useState<string[]>(getArray("tamanhos"));
    const [maxPrice, setMaxPrice] = useState(
        Number(getParam("max", String(MAX_PRICE))),
    );
    const [sort, setSort] = useState<SortOption>(
        getParam("ord", "relevance") as SortOption,
    );
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
    const [results, setResults] = useState<StoreProduct[]>([]);
    const [colorSwatches, setColorSwatches] = useState<ColorSwatch[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<CategoryRow[]>([]);
    const categoryTree: CategoryNode[] = buildTree(categoryOptions);

    useEffect(() => {
        Promise.all([
            fetchProducts(),
            fetchColorSwatches(),
            fetchCategories(),
        ]).then(([products, swatches, catOpts]) => {
            setAllProducts(products);
            setColorSwatches(swatches);
            setCategoryOptions(catOpts);
        });
    }, []);

    const availableSizes = Array.from(
        new Set(allProducts.flatMap((p) => p.sizes)),
    );

    const facets: CatalogFacets = {
        colors: colorSwatches.map((c) => c.name),
        categories: listGrandchildCategories(categoryOptions).map((c) => c.name),
        sizes: availableSizes,
    };

    const pushParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            Object.entries(updates).forEach(([k, v]) => {
                if (v && v !== "all" && v !== "relevance" && v !== String(MAX_PRICE))
                    params.set(k, v);
            });
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            });
        },
        [searchParams, router, pathname],
    );

    useEffect(() => {
        pushParams({
            q: query,
            cat: category,
            cores: colors.join(","),
            tamanhos: sizes.join(","),
            max: String(maxPrice),
            ord: sort,
        });
    }, [query, category, colors, sizes, maxPrice, sort]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            const filters: ProductFilters = {
                query,
                category,
                colors,
                sizes,
                maxPrice,
                sort,
            };
            const filtered = filterProducts(allProducts, filters, facets);
            setResults(sortProducts(filtered, sort));
            setLoading(false);
        }, 200);
        return () => clearTimeout(timer);
    }, [
        query,
        category,
        colors,
        sizes,
        maxPrice,
        sort,
        allProducts,
        colorSwatches,
        categoryOptions,
    ]);

    const toggleColor = (name: string) =>
        setColors((prev) =>
            prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
        );

    const toggleSize = (size: string) =>
        setSizes((prev) =>
            prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
        );

    const clearAll = () => {
        setQuery("");
        setCategory("all");
        setColors([]);
        setSizes([]);
        setMaxPrice(MAX_PRICE);
        setSort("relevance");
    };

    const activeCount = countActiveFilters({
        category,
        colors,
        sizes,
        maxPrice,
    });

    return {
        query,
        setQuery,
        category,
        setCategory,
        colors,
        toggleColor,
        sizes,
        toggleSize,
        maxPrice,
        setMaxPrice,
        sort,
        setSort,
        showFilters,
        setShowFilters,
        loading,
        results,
        colorSwatches,
        categoryOptions,
        categoryTree,
        availableSizes,
        activeCount,
        clearAll,
        maxPriceLimit: MAX_PRICE,
    };
}
