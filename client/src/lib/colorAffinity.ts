import { normalizeColorKey } from "../utils/product";
import type { StoreProduct } from "../types/product/products";

// Afinidade de COR por sessão: registra o que a cliente demonstrou preferir
// (buscou / clicou numa cor / colocou no carrinho) e usa isso pra, nos
// CARROSSÉIS DA PÁGINA DE PRODUTO, mostrar o card do sugerido já na cor mais
// provável — segunda chance pro produto. Só sessionStorage, sem cookie/rede/
// dado pessoal; degrada em silêncio no modo privado (try/catch em tudo).

export type Signals = { searches: string[]; clicks: string[]; carts: string[] };

const KEY = {
    searches: "fem:aff:searches",
    clicks: "fem:aff:clicks",
    carts: "fem:aff:carts",
    salt: "fem:aff:salt",
} as const;

const CAP = 12;

function read(key: string): string[] {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
        return [];
    }
}

// Append com dedupe (mais recente vai pro fim) e teto de CAP itens.
function append(key: string, value: string): void {
    const v = (value ?? "").trim();
    if (!v) return;
    try {
        const list = read(key).filter((x) => x !== v);
        list.push(v);
        while (list.length > CAP) list.shift();
        sessionStorage.setItem(key, JSON.stringify(list));
    } catch {
        // storage indisponível (modo privado etc.) — ignora, nunca quebra a UI.
    }
}

export function recordSearch(query: string): void {
    append(KEY.searches, query);
}

export function recordColorClick(color: string): void {
    append(KEY.clicks, color);
}

export function recordCartColor(color: string): void {
    append(KEY.carts, color);
}

export function getSignals(): Signals {
    return {
        searches: read(KEY.searches),
        clicks: read(KEY.clicks),
        carts: read(KEY.carts),
    };
}

// Sal aleatório guardado UMA vez por sessão: mantém o fallback estável enquanto
// a cliente navega, mas variando entre visitas diferentes.
function getSalt(): number {
    try {
        const existing = sessionStorage.getItem(KEY.salt);
        if (existing) {
            const n = Number(existing);
            if (Number.isFinite(n)) return n;
        }
        const salt = Math.floor(Math.random() * 1e9);
        sessionStorage.setItem(KEY.salt, String(salt));
        return salt;
    } catch {
        return 0;
    }
}

// FNV-1a — hash estável e determinístico (não depende de Math.random).
function hashString(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

type Candidate = { color: string; image: string };

// Escolhe a foto de UMA cor pra exibir no card do carrossel do produto.
// Prioridade: busca > clique > carrinho > fallback estável. Retorna null quando
// não há cor alternativa à capa — aí o card usa a capa, sem nome de cor.
export function pickCarouselVariant(
    product: Pick<StoreProduct, "id" | "images" | "colorImages">,
    signals: Signals,
): { image: string; colorLabel: string } | null {
    const cover = product.images?.[0];
    const map = product.colorImages || {};

    const candidates: Candidate[] = [];
    for (const [color, imgs] of Object.entries(map)) {
        if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]) {
            candidates.push({ color, image: imgs[0] });
        }
    }
    if (candidates.length === 0) return null;

    // 1. BUSCA: cor cuja forma normalizada apareça DENTRO de alguma query.
    //    (pode casar a própria cor da capa — quem busca rosa vê rosa.)
    for (const q of signals.searches) {
        const nq = normalizeColorKey(q);
        if (!nq) continue;
        const hit = candidates.find((c) => nq.includes(normalizeColorKey(c.color)));
        if (hit) return { image: hit.image, colorLabel: hit.color };
    }

    // 2. CLIQUE de cor.
    const clickSet = new Set(signals.clicks.map(normalizeColorKey));
    const clicked = candidates.find((c) => clickSet.has(normalizeColorKey(c.color)));
    if (clicked) return { image: clicked.image, colorLabel: clicked.color };

    // 3. CARRINHO.
    const cartSet = new Set(signals.carts.map(normalizeColorKey));
    const carted = candidates.find((c) => cartSet.has(normalizeColorKey(c.color)));
    if (carted) return { image: carted.image, colorLabel: carted.color };

    // 4. FALLBACK: entre as cores DIFERENTES da capa, uma estável na sessão.
    const alt = candidates.filter((c) => c.image !== cover);
    if (alt.length === 0) return null;
    const chosen = alt[hashString(`${product.id}:${getSalt()}`) % alt.length];
    return { image: chosen.image, colorLabel: chosen.color };
}
