export const PIX_DISCOUNT_RATE = 0.05;

// Janela da promoção: AGORA precisa estar dentro de [saleStart, saleEnd]. Cada limite
// null/ausente é "aberto" — as duas null => promo sem janela (retrocompatível: vale
// enquanto salePrice estiver setado). Espelha isSaleWindowActive do backend.
export function isSaleWindowActive(
    saleStart?: string | null,
    saleEnd?: string | null,
    now: number = Date.now(),
): boolean {
    if (saleStart) {
        const start = new Date(saleStart).getTime();
        if (!Number.isNaN(start) && now < start) return false;
    }
    if (saleEnd) {
        const end = new Date(saleEnd).getTime();
        if (!Number.isNaN(end) && now > end) return false;
    }
    return true;
}

// Preço efetivo: usa salePrice quando existe, é > 0, MENOR que o preço cheio E dentro
// da janela. salePrice = 0/null OU fora da janela => sem promoção (preço cheio).
export function effectivePrice(
    price: number,
    salePrice: number | null | undefined,
    saleStart?: string | null,
    saleEnd?: string | null,
): number {
    if (hasActiveSale(price, salePrice, saleStart, saleEnd)) return salePrice as number;
    return price;
}

export function hasActiveSale(
    price: number,
    salePrice: number | null | undefined,
    saleStart?: string | null,
    saleEnd?: string | null,
): boolean {
    return (
        salePrice != null &&
        salePrice > 0 &&
        salePrice < price &&
        isSaleWindowActive(saleStart, saleEnd)
    );
}

export function pixFromPrice(price: number): number {
    return price * (1 - PIX_DISCOUNT_RATE);
}