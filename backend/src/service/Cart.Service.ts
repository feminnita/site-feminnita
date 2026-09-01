import * as CartRepository from '../repository/Cart.Repository';
import * as OrderRepository from '../repository/Order.Repository';
import * as CartDomain from '../domain/Cart.Domain';
import * as OrderDomain from '../domain/Order.Domain';

export async function getCart(customerId: string) {
    const cart = await CartRepository.findByCustomerId(customerId);
    const items = CartDomain.sanitizeItems(cart?.items ?? []);

    if (items.length === 0) return { items: [] };

    const productIds = items.map((item) => item.productId);
    const products = await OrderRepository.findProductsByIds(productIds);
    const productById = new Map(products.map((p) => [p.id, p]));

    const enriched = items.map((item) => {
        const product = productById.get(item.productId);
        if (!product || !product.active) {
            return {
                ...item,
                unavailable: true as const
            };
        }
        return {
            ...item,
            productName: product.name,
            productImage: Array.isArray(product.images) ? product.images[0] ?? null : null,
            unitPrice: Number(OrderDomain.fromCents(OrderDomain.resolveUnitPriceCents(product))),
        };
    });
    return { items: enriched };
}

export async function updateCart(customerId: string, rawItems: unknown) {
    const items = CartDomain.sanitizeItems(rawItems);
    return CartRepository.upsert(customerId, items);
}

export async function saveCart(customerId: string, rawItems: unknown) {
    const items = CartDomain.sanitizeItems(rawItems);
    return CartRepository.upsert(customerId, items);
}


export async function mergeCart(customerId: string, rawItems: unknown) {
    const inconing = CartDomain.sanitizeItems(rawItems);
    const saved = await CartRepository.findByCustomerId(customerId);
    const merged = CartDomain.mergeItems(CartDomain.sanitizeItems(saved?.items ?? []), inconing);

    await CartRepository.upsert(customerId, merged);

    return getCart(customerId);
}

export async function clearCart(customerId: string) {
    return CartRepository.deleteByCustomerId(customerId);
}