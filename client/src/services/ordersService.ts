import { apiGet } from "./api";
import type {
    AccountOrder,
    AccountOrderDetail,
} from "../types/account/account";

type ApiOrder = Record<string, any>;

export async function fetchMyOrders(): Promise<AccountOrder[]> {
    const orders = (await apiGet<ApiOrder[]>("/api/store/orders")) ?? [];

    return orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: Number(o.total) || 0,
        createdAt: o.createdAt,
        items: Array.isArray(o.items)
            ? o.items.map((i: ApiOrder) => ({
                id: i.id,
                productName: i.productName,
                size: i.size ?? null,
                quantity: i.quantity,
            }))
            : [],
    }));
}

export async function fetchMyOrder(
    id: string,
): Promise<AccountOrderDetail | null> {
    const o = await apiGet<ApiOrder>(`/api/store/orders/${id}`);
    if (!o) return null;

    return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod ?? null,
        installments: o.installments ?? null,
        subtotal: Number(o.subtotal) || 0,
        shippingCost: Number(o.shippingCost) || 0,
        discount: Number(o.discount) || 0,
        total: Number(o.total) || 0,
        couponCode: o.couponCode ?? null,
        shippingMethod: o.shippingMethod ?? null,
        trackingCode: o.trackingCode ?? null,
        trackingUrl: o.trackingUrl ?? null,
        shippingAddress: o.shippingAddress ?? null,
        createdAt: o.createdAt,
        shippedAt: o.shippedAt ?? null,
        items: Array.isArray(o.items)
            ? o.items.map((i: ApiOrder) => ({
                id: i.id,
                productId: i.productId ?? null,
                productName: i.productName,
                productImage: i.productImage ?? null,
                color: i.color ?? null,
                size: i.size ?? null,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice) || 0,
                totalPrice: Number(i.totalPrice) || 0,
            }))
            : [],
    };
}
