import type { CouponData } from "./types";


export const PIX_DISCOUNT_RATE = 0.05;

// Blindagem defensiva de estoque (leitura).
// O StockHub é a fonte de verdade e, por mecanismo comercial de ranqueamento,
// INFLA a quantidade em +1000 por variação. O número que chega ao site deveria
// vir limpo (real), mas o StockHub pode empurrar o inflado por bug. Sempre que o
// site LER a quantidade física de uma variação para EXIBIR/VALIDAR/RESERVAR,
// decodifica antes: raw>=1000 => raw-1000 (1000->0, 1001->1, 1401->401); raw<1000
// fica igual (999->999). É NO-OP no dado atual (nenhum SKU tem stock_qty>=1000);
// é proteção contra oversell futuro. NÃO usar em caminhos de ESCRITA de estoque.
export function physicalStock(raw: number | null | undefined): number {
    const n = Number(raw) || 0;
    return n >= 1000 ? n - 1000 : n;
}

export function toCents(value: string | number): number {
    return Math.round(Number(value) * 100);
}

export function fromCents(cents: number): string {
    return (cents / 100).toFixed(2);
}

export function resolveUnitPriceCents(product: { basePrice: string; salePrice: string | null }): number {
    const baseCents = toCents(product.basePrice);
    if (product.salePrice != null) {
        const saleCents = toCents(product.salePrice);
        // Só cobra o salePrice quando é válido (> 0) E menor que o preço base.
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

