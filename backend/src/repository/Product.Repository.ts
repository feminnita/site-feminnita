import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { products, categories, productsSkus, productsColors, productColorImages } from '../db/schema';

export function findActiveProducts(options: {
    featured?: boolean;
    categorySlug?: string;
    categoryId?: string;
    excludeId?: string;
    limit?: number;
    bestsellerOrder?: boolean;
}) {
    const conditions = [eq(products.active, true)];
    if (options.featured) conditions.push(eq(products.featured, true));
    if (options.categorySlug) conditions.push(eq(categories.slug, options.categorySlug));
    if (options.categoryId) conditions.push(eq(products.categoryId, options.categoryId));
    if (options.excludeId) conditions.push(ne(products.id, options.excludeId));

    let query = db
        .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(...conditions))
        .$dynamic();

    // "mais vendidos" (proxy: sem tabela de vendas — orders=0; usa curadoria + popularidade)
    query = options.bestsellerOrder
        ? query.orderBy(desc(products.isBestseller), desc(products.viewCount), desc(products.createdAt))
        : query.orderBy(desc(products.createdAt));

    if (options.limit) query = query.limit(options.limit);
    return query;
}

export async function findCategoryParentId(categoryId: string): Promise<string | null> {
    const [row] = await db
        .select({ parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);
    return row?.parentId ?? null;
}

export function findActiveProductByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    return db
        .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(eq(products.active, true), eq(isUuid ? products.id : products.slug, idOrSlug)))
        .limit(1);
}

export function findSkuVariantsByProductIds(productIds: string[]) {
    return db
        .select({ productId: productsSkus.productId, size: productsSkus.size, color: productsColors.name })
        .from(productsSkus)
        .leftJoin(productsColors, eq(productsSkus.colorId, productsColors.id))
        .where(inArray(productsSkus.productId, productIds));
}

export function findColorImagesByProductIds(productIds: string[]) {
    return db
        .select({ productId: productColorImages.productId, color: productsColors.name, images: productColorImages.images })
        .from(productColorImages)
        .leftJoin(productsColors, eq(productColorImages.colorId, productsColors.id))
        .where(inArray(productColorImages.productId, productIds));
}

export function findSkuStockByProductId(productId: string) {
    return db
        .select({
            size: productsSkus.size,
            color: productsColors.name,
            stockQty: productsSkus.stockQty,
            reservedQty: productsSkus.reservedQty,
        })
        .from(productsSkus)
        .leftJoin(productsColors, eq(productsSkus.colorId, productsColors.id))
        .where(eq(productsSkus.productId, productId));
}

export function incrementViewCount(id: string) {
    return db
        .update(products)
        .set({ viewCount: sql`${products.viewCount} + 1` })
        .where(eq(products.id, id));
}