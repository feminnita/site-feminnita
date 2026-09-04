import { and, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../config/db';
import { products, categories, productsSkus, productsColors, productColorImages } from '../db/schema';

export function findActiveProducts(options: { featured?: boolean; categorySlug?: string; limit?: number; q?: string }) {
    const conditions: SQL<unknown>[] = [eq(products.active, true)];
    if (options.featured) conditions.push(eq(products.featured, true));
    // Categoria via LIGAÇÃO M:N (product_categories): um produto pode estar em várias
    // categorias. O backfill copiou o category_id antigo pra ligação, então filtrar pela
    // ligação retorna tanto os antigos quanto os novos. (Antes: eq(products.categoryId).)
    if (options.categorySlug) {
        conditions.push(sql`EXISTS (
            SELECT 1 FROM product_categories pc
            JOIN categories c ON c.id = pc.category_id
            WHERE pc.product_id = ${products.id} AND c.slug = ${options.categorySlug}
        )`);
    }

    // Busca livre: casa em NOME, SKU (code) e CATEGORIA.
    const term = options.q?.trim();
    if (term) {
        const like = `%${term}%`;
        const search = or(
            ilike(products.name, like),
            ilike(products.code, like),
            ilike(categories.name, like),
        );
        if (search) conditions.push(search);
    }

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
        .select({ productId: productsSkus.productId, size: productsSkus.size, color: productsColors.name, stockQty: productsSkus.stockQty, reservedQty: productsSkus.reservedQty })
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

// Todos os slugs de categoria do produto via ligação M:N (product_categories) —
// MESMA fonte que o filtro da vitrine usa (findActiveProducts). Serve para resolver
// a herança da tabela de medidas por categoria.
export async function findCategorySlugsByProductId(productId: string): Promise<string[]> {
    const result = await db.execute(sql`
        SELECT c.slug
        FROM product_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.product_id = ${productId}
    `);
    return (result.rows as Array<{ slug: string }>).map((r) => r.slug).filter(Boolean);
}

export function incrementViewCount(id: string) {
    return db
        .update(products)
        .set({ viewCount: sql`${products.viewCount} + 1` })
        .where(eq(products.id, id));
}