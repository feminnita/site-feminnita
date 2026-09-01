import type { CouponData } from "./types";


export const PIX_DISCOUNT_RATE = 0.05;

export function toCents(value: string | number): number {
    return Math.round(Number(value) * 100);
}

export function fromCents(cents: number): string {
    return (cents / 100).toFixed(2);
}

export function resolveUnitPriceCents(product: { basePrice: string; salePrice: string | null }): number {
    return toCents(product.salePrice ?? product.basePrice);
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

