import type { CartItem } from "../types/cart/cart";
import type { CartItemInput, StoreProduct } from "../types/product/products";
import { effectivePrice, pixFromPrice } from "./pricing";

export function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return url;
}

export function getDisplayImages(
  product: Pick<StoreProduct, "images" | "colorImages">,
  selectedColor: string,
): string[] {
  const colorSpecific = product.colorImages?.[selectedColor];
  return colorSpecific?.length ? colorSpecific : product.images;
}

export function buildCartItem(input: CartItemInput): CartItem {
  const price = effectivePrice(input.product.price, input.product.salePrice);
  return {
    ...input.product,
    price,
    pixPrice: pixFromPrice(price),
    selectedSize: input.selectedSize,
    selectedColor: input.selectedColor,
    quantity: input.quantity,
  };
}