import { and, eq, inArray, isNull, sql, desc, or, } from 'drizzle-orm';
import { db } from '../config/db';
import { orders, orderItems, products, productsSkus, productsColors, coupons, customers } from '../db/schema';

export function findProductsByIds(productIds: string[]) {
    return db.query.products.findMany({ where: inArray(products.id, productIds) });
}

export function findCouponByCode(code: string) {
    return db.query.coupons.findFirst({ where: eq(coupons.code, code) });
}

/**
 * Pedido da mesma pessoa feito ha pouco e ainda valido (nem cancelado, nem
 * recusado). A pessoa e reconhecida pelo CPF, e nao pela conta: em 13/10/2026
 * a mesma cliente comprou com dois e-mails e virou duas contas.
 */
export async function findPedidoRecenteDoCpf(cpf: string, minutos: number) {
    const digitos = cpf.replace(/\D/g, '');
    if (digitos.length < 11) return null;
    const [pedido] = await db
        .select({ orderNumber: orders.orderNumber, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId))
        .where(and(
            sql`regexp_replace(coalesce(${customers.cpf}, ''), '[^0-9]', '', 'g') = ${digitos}`,
            sql`${orders.createdAt} > now() - make_interval(mins => ${minutos})`,
            sql`${orders.status} <> 'cancelled'`,
            sql`${orders.paymentStatus} <> 'failed'`,
        ))
        .orderBy(desc(orders.createdAt))
        .limit(1);
    return pedido ?? null;
}

// "Comprou" = pagou. Pedido criado e não pago (Pix vencido, cartão recusado)
// não é compra: contar ele tirava o desconto de quem tentou de novo — a Jullia,
// em 15/10/2026, gerou o Pix com 3%, não pagou, voltou no cartão e pagou sem
// desconto. Regra da Chris: "a primeira compra é a hora que paga".
// Estornado e em disputa contam: a cliente comprou, só não ficou com a peça.
const PAGO = ['paid', 'refunded', 'disputed'] as const;

export function findOrderByCustomerAndCoupon(customerId: string, couponId: string) {
    return db.query.orders.findFirst({
        where: and(eq(orders.customerId, customerId), eq(orders.couponId, couponId), inArray(orders.paymentStatus, [...PAGO]))
    });
}

export function findPaidOrdersByCustomerId(customerId: string) {
    return db.query.orders.findMany({
        where: and(eq(orders.customerId, customerId), inArray(orders.paymentStatus, [...PAGO])),
    });
}

export async function resolveSkuId(productId: string, size: string, color?: string | null) {
    if (!color) {
        const sku = await db.query.productsSkus.findFirst({
            where: and(eq(productsSkus.productId, productId), eq(productsSkus.size, size), isNull(productsSkus.colorId)),
        });
        return sku?.id ?? null;
    }

    const productColor = await db.query.productsColors.findFirst({
        where: eq(productsColors.name, color)
    });

    if (!productColor) throw new Error('COLOR_NOT_FOUND');

    const sku = await db.query.productsSkus.findFirst({
        where: and(
            eq(productsSkus.productId, productId),
            eq(productsSkus.size, size),
            eq(productsSkus.colorId, productColor.id),
        ),

    })
    return sku?.id ?? null;
}

export function findSkuById(skuId: string) {
    return db.query.productsSkus.findFirst({
        where: eq(productsSkus.id, skuId)
    });
}

type OrderInsert = typeof orders.$inferInsert;
type OrderItemInsert = typeof orderItems.$inferInsert;

export async function insertOrderWithItems(
    orderValues: Omit<OrderInsert, 'orderNumber'>,
    items: Omit<OrderItemInsert, 'orderId'>[],
    couponId?: string
) {
    return db.transaction(async (tx) => {
        for (const item of items) {
            const reserved = await tx
                .update(productsSkus)
                .set({
                    reservedQty: sql`${productsSkus.reservedQty} + ${item.quantity}`,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(productsSkus.id, item.skuId!),
                        sql`${productsSkus.stockQty} - ${productsSkus.reservedQty} >= ${item.quantity}`
                    )
                )
                .returning();

            if (reserved.length === 0) {
                throw new Error(`OUT_OF_STOCK:${item.skuId}`);
            }
        }

        if (couponId) {
            const consumed = await tx
                .update(coupons)
                .set({
                    usedCount: sql`${coupons.usedCount} + 1`,
                    active: sql`CASE
                        WHEN ${coupons.maxUses} IS NOT NULL AND ${coupons.usedCount} + 1 >= ${coupons.maxUses}
                        THEN false
                        ELSE ${coupons.active}
                    END`,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(coupons.id, couponId),
                        eq(coupons.active, true),
                        or(isNull(coupons.maxUses), sql`${coupons.usedCount} < ${coupons.maxUses}`)
                    )
                )
                .returning({ id: coupons.id });

            if (consumed.length === 0) {
                throw new Error('COUPON_EXHAUSTED');
            }
        }

        const seqResult = await tx.execute(sql`SELECT nextval('order_number_seq') as nextval`);
        const orderNumber = `ARM-${seqResult.rows[0].nextval}`;

        const [order] = await tx.insert(orders).values({ ...orderValues, orderNumber }).returning();
        await tx.insert(orderItems).values(items.map((item) => ({ ...item, orderId: order.id })));

        return order;

    })
}

export function findOrdersByCustomerId(customerId: string) {
    return db.query.orders.findMany({
        where: eq(orders.customerId, customerId),
        orderBy: [desc(orders.createdAt)],
    });
}

export function findOrderByIndAndCustomerId(orderId: string, customerId: string) {
    return db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.customerId, customerId)),
    });
}

export function findItemsByOrderID(orderId: string) {
    return db.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId)
    });
}

/** Pedido + itens pelo numero (FEM-1234). Usado pelo romaneio dos e-mails. */
export async function findOrderWithItemsByNumber(orderNumber: string) {
    const order = await db.query.orders.findFirst({
        where: eq(orders.orderNumber, orderNumber),
    });
    if (!order) return null;
    const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, order.id),
    });

    // O codigo do SKU (ex: 50700FROGG) e o que a revendedora usa para saber de
    // que peca se trata — so o nome nao basta. A coluna `reference` existe no
    // banco mas nao no schema desta API, entao vem por SQL direto.
    const skuIds = items.map((i) => i.skuId).filter((id): id is string => Boolean(id));
    const referencias = new Map<string, string>();
    if (skuIds.length > 0) {
        const { rows } = await db.execute(sql`
            SELECT id, reference FROM products_skus
            WHERE id IN (${sql.join(skuIds.map((id) => sql`${id}::uuid`), sql`, `)})
        `);
        for (const r of rows as { id: string; reference: string | null }[]) {
            if (r.reference) referencias.set(r.id, r.reference);
        }
    }

    return {
        order,
        items: items.map((i) => ({ ...i, reference: i.skuId ? referencias.get(i.skuId) ?? null : null })),
    };
}

export async function findItemsByOrderIds(orderIds: string[]) {
    if (orderIds.length === 0) return [];
    return db.query.orderItems.findMany({
        where: inArray(orderItems.orderId, orderIds),
    });
}

export function findCustomerForCharge(customerId: string) {
    return db.query.customers.findFirst({ where: eq(customers.id, customerId) })
}

export function saveCustomerAsaasId(customerId: string, asaasCustomerId: string) {
    return db.update(customers).set({ asaasCustomerId }).where(eq(customers.id, customerId))
}

export function saveOrderAsaasPaymentId(orderId: string, asaasPaymentId: string) {
    return db.update(orders).set({ asaasPaymentId, updatedAt: new Date() }).where(eq(orders.id, orderId));
}

// Troca de forma de pagamento: valor, desconto e cobranca mudam juntos, numa
// escrita so. Separar isso em varios updates deixaria o pedido, por um instante,
// com total novo e cobranca velha.
export function saveOrderPaymentChange(
    orderId: string,
    dados: {
        paymentMethod: string;
        installments: number;
        discount: string;
        total: string;
        asaasPaymentId: string;
    },
) {
    return db
        .update(orders)
        .set({ ...dados, updatedAt: new Date() })
        .where(eq(orders.id, orderId));
}

export function findCouponById(couponId: string) {
    return db.query.coupons.findFirst({ where: eq(coupons.id, couponId) });
}

export async function cancelOrdeAndReleaseStock(orderId: string, motivo?: string) {
    const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
    await db
        .update(orders).set({
            status: 'cancelled',
            // falha na criação da cobrança: payment_status vai para 'failed' para
            // não aparecer como "Pendente" na fila de trabalho do painel.
            paymentStatus: 'failed',
            ...(motivo && { notes: motivo }),
            updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

    for (const item of items) {
        if (item.skuId) {
            await db
                .update(productsSkus)
                .set({
                    reservedQty: sql`${productsSkus.reservedQty} - ${item.quantity}`,
                    updatedAt: new Date(),
                })
                .where(eq(productsSkus.id, item.skuId));
        }
    }
}

