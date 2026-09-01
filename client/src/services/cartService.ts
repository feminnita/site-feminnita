import { apiGet, apiPost, apiPut } from './api';
import { PIX_DISCOUNT_RATE } from '../utils/pricing';
import type { CartItem, ServerCartItem, ServerCartLine } from "../types/cart/cart";

const KEY = "cart";
const EVENT = "cartUpdated";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEY, JSON.stringify(items));

  window.dispatchEvent(new Event(EVENT));
}

export function clearCart(): void {
  writeCart([]);
}

function toServerItems(items: CartItem[]): ServerCartItem[] {
  return items.map((item) => ({
    productId: item.id,
    name: item.name,
    size: item.selectedSize,
    color: item.selectedColor || undefined,
    quantity: item.quantity,
    selected: item.selected !== false,
  }));
}

function fromServerLines(lines: ServerCartLine[]): CartItem[] {
  return lines
    .filter((line) => !line.unavailable)
    .map((line) => {
      const price = Number(line.unitPrice) || 0;
      return {
        id: line.productId,
        name: line.productName ?? line.name ?? "Produto",
        images: line.productImage ? [line.productImage] : [],
        price,
        pixPrice: +(price * (1 - PIX_DISCOUNT_RATE)).toFixed(2),
        quantity: line.quantity,
        selectedColor: line.color ?? "",
        selectedSize: line.size,
        selected: line.selected !== false,
      };
    });
}

export async function fetchServerCart(): Promise<CartItem[]> {
  const data = await apiGet<{ items: ServerCartLine[] }>("/api/store/cart");
  return fromServerLines(data?.items ?? []);
}

export async function mergeServerCart(localItems: CartItem[]): Promise<CartItem[]> {
  const data = await apiPost<{ items: ServerCartItem[] }>("/api/store/cart/merge", {
    items: toServerItems(localItems),
  });

  return fromServerLines(data?.items ?? []);
}

export async function saveServerCart(items: CartItem[]): Promise<void> {
  await apiPut("/api/store/cart", toServerItems(items)).catch(() => { });
}
