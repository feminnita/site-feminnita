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

// Distingue o tipo de vídeo do produto pela URL. O caminho padrão agora é um
// arquivo MP4 (Cloudinary) que toca inline na galeria como se fosse foto —
// "youtube" fica só de compatibilidade para produtos antigos que já usam link.
export function videoKind(
  url: string | null | undefined,
): "youtube" | "file" | "none" {
  if (!url) return "none";
  if (/youtu\.?be|youtube\.com/i.test(url)) return "youtube";
  return "file"; // .mp4/.webm/.mov ou Cloudinary /video/upload/ — trata como arquivo
}

// Compara nome de cor tolerante a CAIXA e ACENTO ("preto"=="Preto", "Lilás"=="Lilas").
// A chave de colors e a de colorImages divergem em alguns produtos (ex. 31700:
// colors=preto/MARINHO/Lilas, colorImages=Preto/Marinho/Lilas) — sem normalizar,
// a foto da cor não carrega.
export function normalizeColorKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function getDisplayImages(
  product: Pick<StoreProduct, "images" | "colorImages">,
  selectedColor: string,
): string[] {
  const map = product.colorImages;
  if (map && selectedColor) {
    const target = normalizeColorKey(selectedColor);
    const key = Object.keys(map).find((k) => normalizeColorKey(k) === target);
    const colorSpecific = key ? map[key] : undefined;
    if (colorSpecific?.length) return colorSpecific;
  }
  return product.images;
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