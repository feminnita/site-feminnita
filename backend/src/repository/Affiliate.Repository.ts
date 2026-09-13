import { and, eq, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { afiliadas } from '../db/schema';

/**
 * Acha a afiliada pelo codigo do link, SO se ela estiver aprovada.
 *
 * O codigo chega do navegador (?ref=...), ou seja, de fora: qualquer pessoa
 * pode escrever o que quiser ali. Por isso quem decide e o banco, e pausada ou
 * bloqueada nao volta — o pedido nasce sem afiliada e a venda acontece igual.
 */
export async function aprovadaPorCodigo(codigo: string) {
    const limpo = codigo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
    if (!limpo) return null;

    const [linha] = await db
        .select({
            id: afiliadas.id,
            codigo: afiliadas.codigo,
            percentual: afiliadas.percentual,
        })
        .from(afiliadas)
        .where(and(eq(afiliadas.codigo, limpo), eq(afiliadas.status, 'aprovada')))
        .limit(1);

    return linha ?? null;
}

/**
 * Quanto cada afiliada tem A RECEBER: comissao dos pedidos PAGOS e nao
 * cancelados, menos o que ja foi pago a ela.
 *
 * Sem descontar o que ja saiu, o painel mostraria o total historico para sempre
 * e a Chris pagaria duas vezes.
 */
export async function saldos() {
    const { rows } = await db.execute(sql`
        SELECT
            a.id,
            a.name                                       AS nome,
            a.code                                       AS codigo,
            a.status,
            a.commission_rate                            AS percentual,
            a.pix_key                                    AS chave_pix,
            COUNT(o.id) FILTER (
                WHERE o.payment_status = 'paid' AND o.status <> 'cancelled'
            )::int                                       AS pedidos,
            COALESCE(SUM(o.affiliate_commission::numeric) FILTER (
                WHERE o.payment_status = 'paid' AND o.status <> 'cancelled'
            ), 0)::float                                 AS comissao_total,
            COALESCE((SELECT SUM(p.amount::numeric) FROM affiliate_payouts p
                      WHERE p.affiliate_id = a.id), 0)::float AS ja_pago
        FROM affiliates a
        LEFT JOIN orders o ON o.affiliate_id = a.id
        GROUP BY a.id
        ORDER BY comissao_total DESC, a.name
    `);

    return rows.map((r: any) => ({
        ...r,
        a_pagar: Number((r.comissao_total - r.ja_pago).toFixed(2)),
    }));
}
