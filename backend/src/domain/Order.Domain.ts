import type { CouponData } from "./types";


export const PIX_DISCOUNT_RATE = 0.05;

export function toCents(value: string | number): number {
    return Math.round(Number(value) * 100);
}

export function fromCents(cents: number): string {
    return (cents / 100).toFixed(2);
}

// Janela da promoção: AGORA precisa estar dentro de [saleStart, saleEnd]. Cada
// limite null é "aberto" — as duas null => promo sem janela (retrocompatível: vale
// enquanto salePrice estiver setado). Fonte única, usada pela vitrine e pelo checkout.
export function isSaleWindowActive(
    saleStart: Date | string | null | undefined,
    saleEnd: Date | string | null | undefined,
    now: number = Date.now(),
): boolean {
    if (saleStart != null) {
        const start = new Date(saleStart).getTime();
        if (!Number.isNaN(start) && now < start) return false;
    }
    if (saleEnd != null) {
        const end = new Date(saleEnd).getTime();
        if (!Number.isNaN(end) && now > end) return false;
    }
    return true;
}

export function resolveUnitPriceCents(product: {
    basePrice: string;
    salePrice: string | null;
    saleStart?: Date | string | null;
    saleEnd?: Date | string | null;
}): number {
    const baseCents = toCents(product.basePrice);
    if (product.salePrice != null && isSaleWindowActive(product.saleStart, product.saleEnd)) {
        const saleCents = toCents(product.salePrice);
        // Só cobra o salePrice quando é válido (> 0), menor que o base E dentro da janela.
        if (saleCents > 0 && saleCents < baseCents) return saleCents;
    }
    return baseCents;
}

export function calculateSubtotalCents(items: { unitPriceCents: number; quantity: number }[]): number {
    return items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
}

export function calculatePixDiscountCents(subtotalCents: number, paymentMethod: string): number {
    if (paymentMethod !== 'pix') return 0;
    return Math.round(subtotalCents * PIX_DISCOUNT_RATE);
}

export function calculateTotalCents(subtotalCents: number, discountCents: number, shippingCostCents: number): number {
    return subtotalCents - discountCents + shippingCostCents;
}

//Coupon 
export function calculateCouponDiscountCents(coupon: CouponData, subtotalCents: number): number {
    if (!coupon.active) throw new Error('COUPON_INACTIVE');

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw new Error('COUPON_EXPIRED');

    const minCents = toCents(coupon.minOrderValue ?? 0);
    if (subtotalCents < minCents) throw new Error('COUPON_MIN_ORDER');

    if (coupon.type === 'percent') {
        return Math.round(subtotalCents * (Number(coupon.value) / 100));
    }

    return Math.min(toCents(coupon.value), subtotalCents);
}

