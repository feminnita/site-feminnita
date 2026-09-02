import { and, eq, inArray, isNull, sql, desc, or, } from 'drizzle-orm';
import { db } from '../config/db';
import { orders, orderItems, products, productsSkus, productsColors, coupons, customers } from '../db/schema';

export function findProductsByIds(productIds: string[]) {
    return db.query.products.findMany({ where: inArray(products.id, productIds) });
}

export function findCouponByCode(code: string) {
    return db.query.coupons.findFirst({ where: eq(coupons.code, code) });
}

export function findOrderByCustomerAndCoupon(customerId: string, couponId: string) {
    return db.query.orders.findFirst({
        where: and(eq(orders.customerId, customerId), eq(orders.couponId, couponId))
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
        const orderNumber = `FEM-${seqResult.rows[0].nextval}`;

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

export async function cancelOrdeAndReleaseStock(orderId: string) {
    const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
    await db
        .update(orders).set({
            status: 'cancelled',
            // falha na criação da cobrança: payment_status vai para 'failed' para
            // não aparecer como "Pendente" na fila de trabalho do painel.
            paymentStatus: 'failed',
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

