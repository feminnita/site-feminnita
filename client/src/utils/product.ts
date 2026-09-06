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

// Normaliza a descrição (HTML de rich text OU texto puro com quebras de linha)
// para leitura: parágrafos de verdade e listas com marcador real. Conteúdo é
// escrito no painel (confiável) e já era injetado via dangerouslySetInnerHTML.
// Se já vier com <li>, não mexe (só o CSS cuida). Em erro, devolve o original.
export function formatDescriptionHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  if (/<li\b/i.test(raw)) return raw; // já é lista real
  try {
    const text = raw
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?p>/gi, "")
      .replace(/&nbsp;/gi, " ")
      .trim();
    const isBullet = (l: string) => /^\s*[•\-*▪●·]\s+/.test(l);
    const strip = (l: string) => l.replace(/^\s*[•\-*▪●·]\s+/, "").trim();
    const out: string[] = [];
    for (const block of text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)) {
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const bullets = lines.filter(isBullet);
      if (bullets.length >= 2 && bullets.length >= lines.length - 1) {
        if (!isBullet(lines[0])) out.push(`<p>${lines[0]}</p>`); // cabeçalho do grupo
        out.push(`<ul>${lines.filter(isBullet).map((l) => `<li>${strip(l)}</li>`).join("")}</ul>`);
      } else {
        out.push(`<p>${lines.join("<br>")}</p>`);
      }
    }
    return out.join("") || raw;
  } catch {
    return raw;
  }
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

// Formata o nome da cor SÓ PARA EXIBIÇÃO (title-case por palavra): primeira letra
// de cada palavra em maiúscula, resto minúscula. NÃO inventa acento nem corrige
// ortografia — só muda a caixa ("AZUL"→"Azul", "Lilas"→"Lilas", "AZUL CLARO"→
// "Azul Claro", "VerdeEscuro"→"Verdeescuro"). Espaço e hífen são limites de
// palavra e são preservados ("Azul-claro"→"Azul-Claro"). O valor CRU do banco
// continua sendo usado em seleção/carrinho/lookup — este helper é só texto na tela.
export function formatColorName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .split(/([\s-]+)/)
    .map((token) =>
      token === "" || /^[\s-]+$/.test(token)
        ? token
        : token.charAt(0).toUpperCase() + token.slice(1).toLowerCase(),
    )
    .join("");
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
    if (colorSpecific?.length) {
      // 2+ fotos da cor: a galeria vira a da cor. 1 foto só: mostra a foto da
      // cor primeiro e MANTÉM as capas do produto (sem duplicar).
      if (colorSpecific.length >= 2) return colorSpecific;
      return [
        colorSpecific[0],
        ...product.images.filter((i) => i !== colorSpecific[0]),
      ];
    }
  }
  return product.images;
}

export function buildCartItem(input: CartItemInput): CartItem {
  const price = effectivePrice(
    input.product.price,
    input.product.salePrice,
    input.product.saleStart,
    input.product.saleEnd,
  );
  return {
    ...input.product,
    price,
    pixPrice: pixFromPrice(price),
    selectedSize: input.selectedSize,
    selectedColor: input.selectedColor,
    quantity: input.quantity,
  };
}