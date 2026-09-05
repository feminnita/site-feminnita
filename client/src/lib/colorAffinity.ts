import { normalizeColorKey } from "../utils/product";
import type { StoreProduct } from "../types/product/products";

// Rastreador de PREFERÊNCIA DE COR por SESSÃO (não é dado pessoal — é preferência de
// navegação). Backed por sessionStorage, com try/catch em toda operação: em modo
// privado / storage bloqueado, degrada em silêncio (some sinal, nada quebra).
// SEM cookie, SEM rede, SEM identificação. Some quando a aba fecha.
//
// Uso: os carrosséis da PÁGINA DE PRODUTO mostram o card do produto sugerido na cor
// que a cliente demonstrou interesse na sessão (buscou / clicou / pôs no carrinho) —
// segunda chance pro produto: quem procura rosa vê os sugeridos em rosa.

const KEY_SEARCHES = "fem:aff:searches";
const KEY_CLICKS = "fem:aff:clicks";
const KEY_CARTS = "fem:aff:carts";
const KEY_SALT = "fem:aff:salt";

const CAP = 12;

export type ColorSignals = {
    searches: string[];
    clicks: string[];
    carts: string[];
};

function readList(key: string): string[] {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
        return [];
    }
}

// Append com dedupe (mais recente no fim) e teto de CAP itens.
function appendList(key: string, value: string): void {
    const v = (value ?? "").trim();
    if (!v) return;
    try {
        const list = readList(key).filter((x) => x !== v);
        list.push(v);
        const capped = list.slice(-CAP);
        sessionStorage.setItem(key, JSON.stringify(capped));
    } catch {
        // storage indisponível (modo privado etc.) — ignora, sem quebrar.
    }
}

export function recordSearch(query: string): void {
    appendList(KEY_SEARCHES, query);
}

export function recordColorClick(color: string): void {
    appendList(KEY_CLICKS, color);
}

export function recordCartColor(color: string): void {
    appendList(KEY_CARTS, color);
}

export function getSignals(): ColorSignals {
    return {
        searches: readList(KEY_SEARCHES),
        clicks: readList(KEY_CLICKS),
        carts: readList(KEY_CARTS),
    };
}

// Salt aleatório, gravado UMA vez por sessão — mantém o fallback ESTÁVEL na sessão
// (mesmo produto = mesma cor sugerida enquanto a aba viver), mas variando entre visitas.
function getSalt(): string {
    try {
        let salt = sessionStorage.getItem(KEY_SALT);
        if (!salt) {
            salt = Math.random().toString(36).slice(2);
            sessionStorage.setItem(KEY_SALT, salt);
        }
        return salt;
    } catch {
        return "0"; // sem storage: salt fixo — fallback vira determinístico, ainda estável.
    }
}

// Hash simples (djb2) — determinístico, só pra escolher um índice estável.
function hashString(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = (h * 33) ^ s.charCodeAt(i);
    }
    return h >>> 0;
}

type Candidate = { color: string; image: string };

export type CarouselVariant = { image: string; colorLabel: string };

// Escolhe qual COR (foto única, a mesma da miniatura de variação) o card do carrossel
// deve mostrar, pela preferência da sessão. Retorna null quando só a capa tem foto —
// nesse caso o card usa a capa, sem nome de cor.
export function pickCarouselVariant(
    product: Pick<StoreProduct, "id" | "images" | "colorImages">,
    signals: ColorSignals,
): CarouselVariant | null {
    const cover = product.images?.[0];
    if (!cover) return null;

    const map = product.colorImages ?? {};
    const candidates: Candidate[] = [];
    for (const color of Object.keys(map)) {
        const imgs = map[color];
        if (imgs && imgs.length > 0) {
            candidates.push({ color, image: imgs[0] });
        }
    }
    if (candidates.length === 0) return null;

    // Só faz sentido "cor alternativa" se existir foto DIFERENTE da capa.
    const altCandidates = candidates.filter((c) => c.image !== cover);
    if (altCandidates.length === 0) return null;

    const norm = (s: string) => normalizeColorKey(s);

    // 1) BUSCA: cor cujo nome (normalizado) apareça DENTRO de alguma query buscada.
    //    Pode ser até a própria cor da capa — objetivo é mostrar a cor procurada.
    const searchesN = signals.searches.map(norm).filter(Boolean);
    for (const cand of candidates) {
        const c = norm(cand.color);
        if (c && searchesN.some((q) => q.includes(c))) {
            return { image: cand.image, colorLabel: cand.color };
        }
    }

    // 2) CLIQUE de cor.
    const clicksN = new Set(signals.clicks.map(norm).filter(Boolean));
    for (const cand of candidates) {
        if (clicksN.has(norm(cand.color))) {
            return { image: cand.image, colorLabel: cand.color };
        }
    }

    // 3) CARRINHO.
    const cartsN = new Set(signals.carts.map(norm).filter(Boolean));
    for (const cand of candidates) {
        if (cartsN.has(norm(cand.color))) {
            return { image: cand.image, colorLabel: cand.color };
        }
    }

    // 4) FALLBACK (visitante novo / sem match): entre as cores com foto != capa,
    //    escolhe uma ESTÁVEL na sessão (seed = hash(product.id + salt)).
    const idx = hashString(`${product.id}:${getSalt()}`) % altCandidates.length;
    const chosen = altCandidates[idx];
    return { image: chosen.image, colorLabel: chosen.color };
}
