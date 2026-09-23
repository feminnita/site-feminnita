import { apiPost } from "./api";
import type { CartItem } from "../types/cart/cart";

/**
 * Registra o carrinho de quem está comprando SEM conta, assim que ela se
 * identifica no checkout.
 *
 * Medido em 23/09/2026: 40 pessoas montaram carrinho e o banco guardou 6 — só
 * o de quem estava logada. O lembrete de carrinho abandonado alcançava 2
 * dessas 40; as outras 38 escolheram peça, cor e tamanho, clicaram em comprar
 * e sumiram sem deixar rastro.
 *
 * Nunca lança e nunca bloqueia: se falhar, a compra segue. Isto serve para
 * poder lembrar de quem desistiu — não faz parte do caminho da venda, e não
 * pode atrapalhar quem está no meio de comprar.
 */
export async function registrarCarrinhoDeVisitante(dados: {
    email: string;
    name?: string;
    phone?: string;
    items: CartItem[];
}): Promise<void> {
    try {
        await apiPost("/api/store/cart/visitante", dados);
    } catch {
        // silêncio de propósito: ver o console não ajuda a cliente a comprar.
    }
}
