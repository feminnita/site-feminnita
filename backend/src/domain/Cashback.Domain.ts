/**
 * As regras do cashback, sem banco e sem rede — so conta.
 *
 * Ficam configuraveis no painel (site_settings, chave "cashback") a pedido da
 * Chris em 13/09/2026: ela quer ajustar os valores sem depender de deploy.
 *
 * Nasce DESLIGADO. Enquanto ninguem ligar, a loja se comporta exatamente como
 * antes — ligar cashback e decisao de negocio, nao efeito colateral de deploy.
 */
export type RegrasCashback = {
    /** Desligado = nada e creditado. O padrao. */
    ativo: boolean;
    /** Percentual sobre o valor dos produtos. */
    percentual: number;
    /** So ganha cashback pedido a partir deste valor. 0 = sem minimo. */
    minimoPedido: number;
    /** Teto por pedido, para uma compra grande nao virar credito gigante. 0 = sem teto. */
    tetoPorPedido: number;
};

export const REGRAS_PADRAO: RegrasCashback = {
    ativo: false,
    percentual: 0,
    minimoPedido: 0,
    tetoPorPedido: 0,
};

/**
 * Le o que veio do banco (jsonb, ou seja, qualquer coisa) e devolve regras
 * confiaveis. Campo faltando ou invalido cai no padrao — melhor nao creditar
 * do que creditar errado.
 */
export function lerRegras(bruto: unknown): RegrasCashback {
    const o = (bruto ?? {}) as Record<string, unknown>;
    const numero = (v: unknown, max: number) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
    };
    return {
        ativo: o.ativo === true,
        percentual: numero(o.percentual, 100),
        minimoPedido: numero(o.minimoPedido, 1_000_000),
        tetoPorPedido: numero(o.tetoPorPedido, 1_000_000),
    };
}

/**
 * Quanto este pedido gera de cashback, em centavos.
 *
 * A base e a mesma da comissao de afiliada: produtos MENOS desconto, SEM frete.
 * Frete vai para a transportadora — dar cashback sobre ele seria devolver
 * dinheiro que nunca foi margem. E com cupom, a base e o que entrou de verdade.
 */
export function calcularCashbackCents(
    subtotalCents: number,
    descontoCents: number,
    regras: RegrasCashback,
): number {
    if (!regras.ativo || regras.percentual <= 0) return 0;

    const baseCents = Math.max(subtotalCents - descontoCents, 0);
    if (baseCents <= 0) return 0;

    // O minimo olha a base, nao o total com frete: senao um pedido pequeno com
    // frete caro passaria no minimo sem ter comprado quase nada.
    if (regras.minimoPedido > 0 && baseCents < Math.round(regras.minimoPedido * 100)) {
        return 0;
    }

    const cents = Math.round((baseCents * regras.percentual) / 100);
    const tetoCents = Math.round(regras.tetoPorPedido * 100);
    return tetoCents > 0 ? Math.min(cents, tetoCents) : cents;
}
