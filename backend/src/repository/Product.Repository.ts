import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { products, categories, productsSkus, productsColors, productColorImages } from '../db/schema';

export function findActiveProducts(options: { featured?: boolean; categorySlug?: string; limit?: number }) {
    const conditions = [eq(products.active, true)];
    if (options.featured) conditions.push(eq(products.featured, true));
    if (options.categorySlug) conditions.push(eq(categories.slug, options.categorySlug));

    let query = db
        .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .$dynamic();

    if (options.limit) query = query.limit(options.limit);
    return query;
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