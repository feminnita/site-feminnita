import { CartItem } from '../db/schema';

const MAX_QUANTITY_PER_ITEM = 99;

function itemKey(item: CartItem): string {
    return `${item.productId}|${item.size}|${item.color ?? ''}`;
}

export function sanitizeItems(raw: unknown): CartItem[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .filter(
            (item): item is CartItem =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as CartItem).productId === 'string' &&
                typeof (item as CartItem).size === 'string' &&
                typeof (item as CartItem).quantity === 'number'
        )
        .map((item) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            color: typeof item.color === 'string' ? item.color : undefined,
            quantity: Math.min(Math.max(Math.round(item.quantity), 1), MAX_QUANTITY_PER_ITEM),
            selected: item.selected !== false,
        }));
}

export function mergeItems(saved: CartItem[], incoming: CartItem[]): CartItem[] {
    const merged = new Map<string, CartItem>();

    for (const item of [...saved, ...incoming]) {
        const key = itemKey(item);
        const existing = merged.get(key);
        if (existing) {
            existing.quantity = Math.min(existing.quantity + item.quantity, MAX_QUANTITY_PER_ITEM);
            existing.selected = existing.selected !== false || item.selected !== false;
        } else {
            merged.set(key, { ...item });
        }
    }

    return [...merged.values()];
}