import * as ProductRepository from '../repository/Product.Repository';
import * as SiteSettingsRepository from '../repository/SiteSettings.Repository';
import { PIX_DISCOUNT_RATE, resolveUnitPriceCents } from '../domain/Order.Domain';
import { sortSizes } from '../utils/sizes';
import { resolveSizeChart, type SizeChartsSetting } from './SizeChart.Service';
import type { StoreProduct } from './types';

type ProductRow = Awaited<ReturnType<typeof ProductRepository.findActiveProducts>>[number];

// Trava de segurança (rede da Chris): um produto cujo PREÇO DE VENDA EFETIVO ≤ 0
// NUNCA pode ser servido como visível/comprável na vitrine — não importa a origem
// do dado (inclusive o que entra pelo sync do Bling, que não passa por cadastro aqui).
// É filtro de LEITURA (serializer): não altera nada no banco, só deixa de expor o
// produto quebrado. O preço efetivo é o MESMO que o checkout cobra (resolveUnitPriceCents):
// salePrice quando válido (>0 e < base), senão basePrice. ≤ 0 => produto indisponível.
function hasValidSalePrice(product: { basePrice: string; salePrice: string | null }): boolean {
    return resolveUnitPriceCents(product) > 0;
}
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
        isOutlet: p.isOutlet ?? false,
        active: p.active ?? true, stock, view_count: p.viewCount ?? 0,
        // Avaliações: infra de reviews ainda não existe (fonte é decisão pendente da
        // dona). Retornamos vazio por enquanto — o display no site some quando vazio.
        reviews: [],
    };
}

export async function listProducts(options: { featured?: boolean; categorySlug?: string; flag?: 'is_new' | 'is_bestseller' | 'is_outlet'; limit?: number; q?: string }) {
    const rows = (await ProductRepository.findActiveProducts(options))
        .filter((r) => hasValidSalePrice(r.product));
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.product.id);
    const [variants, colorImageRows] = await Promise.all([
        ProductRepository.findSkuVariantsByProductIds(ids),
        ProductRepository.findColorImagesByProductIds(ids),
    ]);

    // Regra de vitrine (refinada pela dona): o que some é a VARIAÇÃO, não o produto.
    // Um produto só sai da grade quando TEM variações E TODAS estão zeradas (não
    // sobra nada pra comprar). Produto SEM nenhuma variação cadastrada (em recadastro)
    // NÃO é esgotado — permanece visível. Regra: manter se (nenhuma variante) OU
    // (algum disponível > 0); esconder só se (tem variantes E todas zeradas).
    // Filtro de LEITURA — não altera o banco; volta sozinho quando entrar estoque.
    const productsWithVariants = new Set(variants.map((v) => v.productId));
    return rows
        .map((row) => mapProduct(row, variants, colorImageRows))
        .filter((product) => !productsWithVariants.has(product.id) || product.stock > 0);
}

export async function getProduct(idOrSlug: string) {
    const [row] = await ProductRepository.findActiveProductByIdOrSlug(idOrSlug);
    if (!row || !hasValidSalePrice(row.product)) throw new Error('PRODUCT_NOT_FOUND');

    const [variants, colorImageRows, categorySlugs, sizeChartsSetting] = await Promise.all([
        ProductRepository.findSkuVariantsByProductIds([row.product.id]),
        ProductRepository.findColorImagesByProductIds([row.product.id]),
        ProductRepository.findCategorySlugsByProductId(row.product.id),
        SiteSettingsRepository.findByKey('size_charts'),
    ]);

    const mapped = mapProduct(row, variants, colorImageRows);

    // Categorias do produto: ligação M:N (mesma fonte da vitrine) + a categoria
    // legada do próprio produto, para máxima consistência na herança.
    const allSlugs = [...categorySlugs, ...(row.categorySlug ? [row.categorySlug] : [])];
    const sizeChart = resolveSizeChart({
        productChart: row.product.sizeChart,
        charts: (sizeChartsSetting?.value as SizeChartsSetting) ?? {},
        categorySlugs: allSlugs,
        sizes: mapped.sizes,
    });

    return { ...mapped, sizeChart };
}

export async function getProductStock(idOrSlug: string) {
    const [row] = await ProductRepository.findActiveProductByIdOrSlug(idOrSlug);
    if (!row || !hasValidSalePrice(row.product)) throw new Error('PRODUCT_NOT_FOUND');

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
    if (!row || !hasValidSalePrice(row.product)) throw new Error('PRODUCT_NOT_FOUND');

    await ProductRepository.incrementViewCount(row.product.id);
}