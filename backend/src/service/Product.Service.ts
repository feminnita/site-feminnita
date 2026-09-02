import * as ProductRepository from '../repository/Product.Repository';
import { PIX_DISCOUNT_RATE } from '../domain/Order.Domain';
import { sortSizes } from '../utils/sizes';
import type { StoreProduct } from './types';

type ProductRow = Awaited<ReturnType<typeof ProductRepository.findActiveProducts>>[number];
type VariantRow = Awaited<ReturnType<typeof ProductRepository.findSkuVariantsByProductIds>>[number];
type ColorImageRow = Awaited<ReturnType<typeof ProductRepository.findColorImagesByProductIds>>[number];

function mapProduct(row: ProductRow, variants: VariantRow[], colorImageRows: ColorImageRow[]): StoreProduct {
    const p = row.product;
    const pvs = variants.filter((v) => v.productId === p.id);
    const colors = [...new Set(pvs.map((v) => v.color).filter(Boolean))] as string[];
    const sizes = sortSizes([...new Set(pvs.map((v) => v.size).filter(Boolean))] as string[]);

    // Estoque do produto = soma do disponível das variações (fonte de verdade).
    // products.stock é campo denormalizado que não é recalculado no cadastro — não usar.
    const stock = pvs.reduce((sum, v) => sum + Math.max(0, (v.stockQty ?? 0) - (v.reservedQty ?? 0)), 0);

    const colorImages: Record<string, string[]> = {};
    for (const imageRow of colorImageRows.filter((c) => c.productId === p.id)) {
        if (imageRow.color) colorImages[imageRow.color] = Array.isArray(imageRow.images) ? imageRow.images : [];
    }

    const price = Number(p.basePrice) || 0;
    const pixPrice = p.pixPrice ? Number(p.pixPrice) : +(price * (1 - PIX_DISCOUNT_RATE)).toFixed(2);
    const installments = price >= 50 ? 3 : 1;

    return {
        id: p.id, code: p.code ?? '', name: p.name, slug: p.slug, description: p.description ?? '',
        price, pixPrice, salePrice: p.salePrice ? Number(p.salePrice) : null,
        installments, installmentPrice: +(price / installments).toFixed(2),
        images: Array.isArray(p.images) ? p.images : [],
        colorImages, videoUrl: p.videoUrl ?? null,
        colors, sizes,
        category: row.categoryName ?? '', category_id: p.categoryId ?? null,
        featured: p.featured ?? false, isNew: p.isNew ?? false, isBestseller: p.isBestseller ?? false,
        active: p.active ?? true, stock, view_count: p.viewCount ?? 0,
    };
}

export async function listProducts(options: { featured?: boolean; categorySlug?: string; limit?: number }) {
    const rows = await ProductRepository.findActiveProducts(options);
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.product.id);
    const [variants, colorImageRows] = await Promise.all([
        ProductRepository.findSkuVariantsByProductIds(ids),
        ProductRepository.findColorImagesByProductIds(ids),
    ]);

    return rows.map((row) => mapProduct(row, variants, colorImageRows));
}

export async function getProduct(idOrSlug: string) {
    const [row] = await ProductRepository.findActiveProductByIdOrSlug(idOrSlug);
    if (!row) throw new Error('PRODUCT_NOT_FOUND');

    const [variants, colorImageRows] = await Promise.all([
        ProductRepository.findSkuVariantsByProductIds([row.product.id]),
        ProductRepository.findColorImagesByProductIds([row.product.id]),
    ]);

    return mapProduct(row, variants, colorImageRows);
}

export async function getProductStock(idOrSlug: string) {
    const [row] = await ProductRepository.findActiveProductByIdOrSlug(idOrSlug);
    if (!row) throw new Error('PRODUCT_NOT_FOUND');

    const skus = await ProductRepository.findSkuStockByProductId(row.product.id);

    return skus.map((sku) => {
        const availableQty = Math.max(0, (sku.stockQty ?? 0) - (sku.reservedQty ?? 0));
        const stockStatus =
            availableQty === 0 ? 'out_of_stock'
                : availableQty <= 3 ? 'low_stock'
                    : 'in_stock';

        return {
            size: sku.size,
            color: sku.color,
            availableQty,
            stockStatus
        };
    });
}

export async function registerView(idOrSlug: string) {
    const [row] = await ProductRepository.findActiveProductByIdOrSlug(idOrSlug);
    if (!row) throw new Error('PRODUCT_NOT_FOUND');

    await ProductRepository.incrementViewCount(row.product.id);
}