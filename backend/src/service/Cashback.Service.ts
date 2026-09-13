import { eq, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { extratoCashback, orders, siteSettings } from '../db/schema';
import * as CashbackDomain from '../domain/Cashback.Domain';

export const CHAVE = 'cashback';

export async function regras(): Promise<CashbackDomain.RegrasCashback> {
    const [linha] = await db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, CHAVE))
        .limit(1);
    return CashbackDomain.lerRegras(linha?.value);
}

/**
 * Credita o cashback de um pedido que ACABOU de ser pago.
 *
 * Chamada de dentro da transicao para "pago", que e idempotente: ela so roda
 * quando o pedido passou de nao-pago para pago, uma unica vez. Sem isso, um
 * webhook duplicado do Asaas daria credito dobrado — e webhook duplicado nao e
 * excecao, e o comportamento normal de entrega at-least-once.
 *
 * Guarda de seguranca propria: se ja existir lancamento de 'ganho' para este
 * pedido, nao credita de novo. Duas travas porque e dinheiro.
 */
export async function creditarPorPedidoPago(pedidoId: string) {
    const r = await regras();
    if (!r.ativo || r.percentual <= 0) return 0;

    const [pedido] = await db
        .select({
            id: orders.id,
            customerId: orders.customerId,
            subtotal: orders.subtotal,
            discount: orders.discount,
        })
        .from(orders)
        .where(eq(orders.id, pedidoId))
        .limit(1);

    // Pedido sem cliente identificado nao tem para quem creditar.
    if (!pedido?.customerId) return 0;

    const jaTem = await db
        .select({ id: extratoCashback.id })
        .from(extratoCashback)
        .where(sql`${extratoCashback.pedidoId} = ${pedidoId} AND ${extratoCashback.tipo} = 'ganho'`)
        .limit(1);
    if (jaTem.length) return 0;

    const cents = CashbackDomain.calcularCashbackCents(
        Math.round(Number(pedido.subtotal) * 100),
        Math.round(Number(pedido.discount ?? 0) * 100),
        r,
    );
    if (cents <= 0) return 0;

    const valor = (cents / 100).toFixed(2);

    await db.insert(extratoCashback).values({
        clienteId: pedido.customerId,
        pedidoId: pedido.id,
        tipo: 'ganho',
        valor,
        motivo: `${r.percentual}% do pedido`,
    });

    // Tambem no pedido, para a tela dele mostrar sem somar o extrato inteiro.
    await db.update(orders).set({ cashbackEarned: valor }).where(eq(orders.id, pedido.id));

    return cents;
}

/**
 * Tira o cashback quando o pedido e cancelado ou estornado.
 *
 * Sem isto, cancelar a compra deixaria o credito de pe: a cliente recebe o
 * dinheiro de volta E fica com o cashback. Lanca uma linha negativa em vez de
 * apagar a antiga — o extrato tem que contar a historia inteira.
 */
export async function estornarPorPedido(pedidoId: string) {
    const ganhos = await db
        .select({ valor: extratoCashback.valor, clienteId: extratoCashback.clienteId })
        .from(extratoCashback)
        .where(sql`${extratoCashback.pedidoId} = ${pedidoId} AND ${extratoCashback.tipo} = 'ganho'`);

    if (!ganhos.length) return 0;

    const jaEstornado = await db
        .select({ id: extratoCashback.id })
        .from(extratoCashback)
        .where(sql`${extratoCashback.pedidoId} = ${pedidoId} AND ${extratoCashback.tipo} = 'estorno'`)
        .limit(1);
    if (jaEstornado.length) return 0;

    for (const g of ganhos) {
        await db.insert(extratoCashback).values({
            clienteId: g.clienteId,
            pedidoId,
            tipo: 'estorno',
            valor: `-${Number(g.valor).toFixed(2)}`,
            motivo: 'pedido cancelado',
        });
    }
    return ganhos.length;
}

/** Saldo da cliente: a soma do extrato. Nao existe coluna de saldo, de proposito. */
export async function saldo(clienteId: string): Promise<number> {
    const { rows } = await db.execute(sql`
        SELECT COALESCE(SUM(amount::numeric), 0)::float AS saldo
        FROM cashback_entries WHERE customer_id = ${clienteId}
    `);
    return Number((rows[0] as any)?.saldo ?? 0);
}
