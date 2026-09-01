export type CouponData = {
    type: 'percent' | 'fixed';
    value: string;
    minOrderValue: string | null;
    active: boolean;
    expiresAt: Date | null;
}