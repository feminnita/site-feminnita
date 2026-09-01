import type { CartItem } from "../types/cart/cart";

function sameVariant(a: CartItem, b: CartItem): boolean {
    return (
        a.id === b.id &&
        a.selectedColor === b.selectedColor &&
        a.selectedSize === b.selectedSize
    );
}

export function isSelected(item: CartItem): boolean {
    return item.selected !== false;
}

export function addItem(items: CartItem[], newItem: CartItem): CartItem[] {
    const idx = items.findIndex((item) => sameVariant(item, newItem));

    if (idx === -1) return [...items, { ...newItem, selected: true }];
    return items.map((item, p) =>
        p === idx ? { ...item, quantity: item.quantity + newItem.quantity } : item,
    );
}

export function removeAt(items: CartItem[], index: number): CartItem[] {
    return items.filter((_, item) => item !== index);
}

export function setQuantityAt(
    items: CartItem[],
    index: number,
    quantity: number,
): CartItem[] {
    if (quantity < 1) return items;
    return items.map((item, p) => (p === index ? { ...item, quantity } : item));
}

export function toggleSelectedAt(items: CartItem[], index: number): CartItem[] {
    return items.map((item, p) =>
        p === index ? { ...item, selected: !isSelected(item) } : item,
    );
}

export function setAllSelected(items: CartItem[], selected: boolean): CartItem[] {
    return items.map((item) => ({ ...item, selected }));
}

export function selectedItems(items: CartItem[]): CartItem[] {
    return items.filter(isSelected);
}

export function selectedCount(items: CartItem[]): number {
    return selectedItems(items).reduce((sum, item) => sum + item.quantity, 0);
}

export function selectedSubTotal(items: CartItem[]): number {
    return selectedItems(items).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
    );
}

export function removeSelected(items: CartItem[]): CartItem[] {
    return items.filter((item) => !isSelected(item));
}

export function cartCount(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function mergeCarts(base: CartItem[], incoming: CartItem[]): CartItem[] {
    return incoming.reduce((acc, item) => addItem(acc, item), base);
}
