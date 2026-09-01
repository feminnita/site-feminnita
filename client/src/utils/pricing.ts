export const PIX_DISCOUNT_RATE = 0.05;

// Preço efetivo: usa salePrice quando existe, é > 0 e MENOR que o preço cheio.
// salePrice = 0/null => sem promoção (retorna o preço cheio).
export function effectivePrice(
    price: number,
    salePrice: number | null | undefined,
): number {
    if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
    return price;
}

export function hasActiveSale(
    price: number,
    salePrice: number | null | undefined,
): boolean {
    return salePrice != null && salePrice > 0 && salePrice < price;
}

export function pixFromPrice(price: number): number {
    return price * (1 - PIX_DISCOUNT_RATE);
}