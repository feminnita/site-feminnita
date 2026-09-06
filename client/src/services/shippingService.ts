import { apiPost } from "./api";
import type { CartItem } from "../types/cart/cart";
import type { ShippingOption } from "../types/checkout/checkout";

type ApiOption = Record<string, any>;

export async function quoteShipping(
    cep: string,
    items: CartItem[],
): Promise<ShippingOption[]> {
    const options = (await apiPost<ApiOption[]>("/api/store/shipping/quote", {
        cep,
        items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
        })),
    })) as ApiOption[];

    return (options ?? []).map((o) => ({
        id: Number(o.id),
        name: o.name,
        company: o.company ?? "",
        price: Number(o.price) || 0,
        deliveryDays: Number(o.deliveryDays) || 0,
        pickup: o.pickup === true,
        address: o.address ?? undefined,
        hours: o.hours ?? undefined,
        note: o.note ?? undefined,
    }));
}