import type { StoreProduct } from "../types/product/products";
import type {
    CatalogFacets,
    ProductFilters,
    ParsedQuery,
    SortOption,
} from "../types/catalog/catalog";

export const MAX_PRICE = 500;
export const SUGGESTIONS = ["Curto", "Longo", "Conjunto"];

const FABRIC_ALIASES: Record<string, string[]> = {
    suede: ["suede"],
    moletinho: ["moletinho"],
    poliamida: ["poliamida"],
};

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWholeWordMatch(text: string, word: string): boolean {
    const escaped = escapeRegExp(word);
    return new RegExp(`(?<![\\p{L}\\d])${escaped}(?![\\p{L}\\d])`, "iu").test(
        text,
    );
}

function removeWholeWord(text: string, word: string): string {
    const escaped = escapeRegExp(word);
    return text.replace(
        new RegExp(`(?<![\\p{L}\\d])${escaped}(?![\\p{L}\\d])`, "giu"),
        "",
    );
}

export function parseQuery(raw: string, facets: CatalogFacets): ParsedQuery {
    const lower = raw.toLowerCase();
    const colors: string[] = [];
    const sizes: string[] = [];
    const categories: string[] = [];
    const fabrics: string[] = [];

    facets.sizes.forEach((size) => {
        if (isWholeWordMatch(lower, size)) sizes.push(size);
    });

    facets.colors.forEach((color) => {
        if (isWholeWordMatch(lower, color)) colors.push(color);
    });

    facets.categories.forEach((category) => {
        if (isWholeWordMatch(lower, category)) categories.push(category);
    });

    Object.entries(FABRIC_ALIASES).forEach(([Key, aliases]) => {
        if (aliases.some((alias) => isWholeWordMatch(lower, alias)))
            fabrics.push(Key);
    });

    const termsToRemove = [
        ...sizes,
        ...colors,
        ...categories,
        ...fabrics.flatMap((f) => FABRIC_ALIASES[f] ?? []),
    ];

    let text = raw;
    termsToRemove.forEach((t) => {
        text = removeWholeWord(text, t);
    });
    text = text.trim().replace(/\s+/g, " ");

    return {
        text,
        colors,
        sizes,
        categories,
        fabrics,
    };
}

export function filterProducts(
    products: StoreProduct[],
    filters: ProductFilters,
    facets: CatalogFacets,
): StoreProduct[] {
    const parsed = parseQuery(filters.query, facets);
    const effectiveColors = [...new Set([...filters.colors, ...parsed.colors])];
    const effectiveSizes = [...new Set([...filters.sizes, ...parsed.sizes])];
    const effectiveCategories =
        filters.category !== "all" ? [filters.category] : parsed.categories;

    return products.filter((product) => {
        // Busca livre bate em NOME, SKU (code) e CATEGORIA — as três dimensões.
        if (parsed.text) {
            const needle = parsed.text.toLowerCase();
            const matchesText =
                product.name.toLowerCase().includes(needle) ||
                (product.code?.toLowerCase().includes(needle) ?? false) ||
                (product.category?.toLowerCase().includes(needle) ?? false);
            if (!matchesText) return false;
        }

        if (
            effectiveCategories.length > 0 &&
            !effectiveCategories.includes(product.category)
        )
            return false;

        if (
            effectiveColors.length > 0 &&
            !effectiveColors.some((color) =>
                product.colors
                    .map((x) => x.toLowerCase())
                    .includes(color.toLowerCase()),
            )
        )
            return false;

        if (
            effectiveSizes.length > 0 &&
            !effectiveSizes.some((size) =>
                product.sizes.some(
                    (ps) => ps.toUpperCase() === size.toUpperCase(),
                ),
            )
        )
            return false;

        if (product.pixPrice > filters.maxPrice) return false;

        return true;
    });
}

export function sortProducts(
    products: StoreProduct[],
    sort: SortOption,
): StoreProduct[] {
    const sorted = [...products];

    switch (sort) {
        case "price-asc":
            sorted.sort((a, b) => a.pixPrice - b.pixPrice);
            break;

        case "price-desc":
            sorted.sort((a, b) => b.pixPrice - a.pixPrice);
            break;

        case "name":
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    return sorted;
}

export function countActiveFilters(
    filters: Pick<ProductFilters, "colors" | "sizes" | "category" | "maxPrice">,
): number {
    return (
        (filters.category !== "all" ? 1 : 0) +
        filters.colors.length +
        filters.sizes.length +
        (filters.maxPrice < MAX_PRICE ? 1 : 0)
    );
}
