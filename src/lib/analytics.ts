// GA4 Enhanced Ecommerce helpers
// All events follow GA4 / Google Ads ecommerce spec

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    ttq?: { track: (...args: any[]) => void };
    dataLayer?: any[];
  }
}

type Item = {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  size?: string;
  color?: string;
};

function gtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) window.gtag(...args);
}

function fbq(event: string, data?: object) {
  if (typeof window !== "undefined" && window.fbq) window.fbq("track", event, data);
}

function ttq(event: string, data?: object) {
  if (typeof window !== "undefined" && window.ttq) window.ttq.track(event, data);
}

function toGA4Item(item: Item) {
  return {
    item_id: item.id,
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity: item.quantity ?? 1,
    ...(item.size && { item_variant: item.size }),
  };
}

// ── Funnel events ─────────────────────────────────────────────────

export function trackViewItem(item: Item) {
  gtag("event", "view_item", {
    currency: "BRL",
    value: item.price,
    items: [toGA4Item(item)],
  });
  fbq("ViewContent", { content_ids: [item.id], content_type: "product", value: item.price, currency: "BRL" });
  ttq("ViewContent", { content_id: item.id, value: item.price, currency: "BRL" });
}

export function trackAddToCart(item: Item) {
  gtag("event", "add_to_cart", {
    currency: "BRL",
    value: item.price * (item.quantity ?? 1),
    items: [toGA4Item(item)],
  });
  fbq("AddToCart", { content_ids: [item.id], content_type: "product", value: item.price, currency: "BRL" });
  ttq("AddToCart", { content_id: item.id, value: item.price, currency: "BRL" });
}

export function trackBeginCheckout(items: Item[], value: number) {
  gtag("event", "begin_checkout", {
    currency: "BRL",
    value,
    items: items.map(toGA4Item),
  });
  fbq("InitiateCheckout", { num_items: items.length, value, currency: "BRL" });
  ttq("InitiateCheckout", { value, currency: "BRL" });
}

export function trackAddShippingInfo(items: Item[], value: number, shippingTier: string) {
  gtag("event", "add_shipping_info", {
    currency: "BRL",
    value,
    shipping_tier: shippingTier,
    items: items.map(toGA4Item),
  });
}

export function trackAddPaymentInfo(items: Item[], value: number, paymentType: string) {
  gtag("event", "add_payment_info", {
    currency: "BRL",
    value,
    payment_type: paymentType,
    items: items.map(toGA4Item),
  });
  fbq("AddPaymentInfo", { value, currency: "BRL" });
}

export function trackPurchase(
  orderId: string,
  items: Item[],
  value: number,
  shipping: number,
  discount: number
) {
  gtag("event", "purchase", {
    transaction_id: orderId,
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
  ttq("PlaceAnOrder", { content_ids: items.map((i) => i.id), value, currency: "BRL" });

  // Google Ads conversion
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/purchase`,
      value,
      currency: "BRL",
      transaction_id: orderId,
    });
  }
}

export function trackSearch(searchTerm: string) {
  gtag("event", "search", { search_term: searchTerm });
}

export function trackViewItemList(items: Item[], listName: string) {
  gtag("event", "view_item_list", {
    item_list_name: listName,
    items: items.map(toGA4Item),
  });
}

export function trackSelectItem(item: Item, listName: string) {
  gtag("event", "select_item", {
    item_list_name: listName,
    items: [toGA4Item(item)],
  });
}
