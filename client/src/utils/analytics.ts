import type { StoreProduct } from "@/src/types/product/products";
import type { CartItem } from "@/src/types/cart/cart";

function gtag(event: string, params: Record<string, unknown>): void {
    if (typeof window === "undefined") return;
    if ((window as any).gtag) (window as any).gtag("event", event, params);
}

function fbq(event: string, params: Record<string, unknown>): void {
    if (typeof window === "undefined") return;
    if ((window as any).fbq) (window as any).fbq("track", event, params);
}

function ttq(event: string, params: Record<string, unknown>): void {
    if (typeof window === "undefined") return;
    if ((window as any).ttq?.track) (window as any).ttq.track(event, params);
}

function toGA4Item(item: CartItem) {
    return {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
    };
}

export function trackViewItemAnalytics(product: StoreProduct): void {
    gtag("view_item", {
        currency: "BRL",
        value: product.pixPrice,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                price: product.pixPrice,
                quantity: 1,
            },
        ],
    });

    fbq("ViewContent", {
        content_ids: [product.id],
        content_type: "product",
        value: product.pixPrice,
        currency: "BRL",
    });
}

export function trackAddToCartAnalytics(
    product: StoreProduct,
    quantity: number,
): void {
    gtag("add_to_cart", {
        currency: "BRL",
        value: product.pixPrice * quantity,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                price: product.pixPrice,
                quantity,
            },
        ],
    });

    fbq("AddToCart", {
        content_ids: [product.id],
        content_type: "product",
        value: product.pixPrice * quantity,
        currency: "BRL",
    });
}

export function trackBeginCheckout(items: CartItem[], value: number): void {
    gtag("begin_checkout", {
        currency: "BRL",
        value,
        items: items.map(toGA4Item),
    });
    fbq("InitiateCheckout", {
        num_items: items.length,
        value,
        currency: "BRL",
    });
    ttq("InitiateCheckout", { value, currency: "BRL" });
}

export function trackAddShippingInfo(
    items: CartItem[],
    value: number,
    shippingTier: string,
): void {
    gtag("add_shipping_info", {
        currency: "BRL",
        value,
        shipping_tier: shippingTier,
        items: items.map(toGA4Item),
    });
}

export function trackAddPaymentInfo(
    items: CartItem[],
    value: number,
    paymentType: string,
): void {
    gtag("add_payment_info", {
        currency: "BRL",
        value,
        payment_type: paymentType,
        items: items.map(toGA4Item),
    });
    fbq("AddPaymentInfo", { value, currency: "BRL" });
}

export function trackPurchase(
    orderNumber: string,
    items: CartItem[],
    value: number,
    shipping: number,
    discount: number,
): void {
    gtag("purchase", {
        transaction_id: orderNumber,
        currency: "BRL",
        value,
        shipping,
        discount,
        items: items.map(toGA4Item),
    });
    fbq("Purchase", {
        content_ids: items.map((i) => i.id),
        content_type: "product",
        value,
        currency: "BRL",
        num_items: items.length,
    });
    ttq("PlaceAnOrder", {
        content_ids: items.map((i) => i.id),
        value,
        currency: "BRL",
    });
}
