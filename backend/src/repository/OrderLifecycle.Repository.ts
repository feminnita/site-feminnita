import { eq, sql, and, ne } from 'drizzle-orm';
import { db } from '../config/db';
import { orders, orderItems, productsSkus, customers } from '../db/schema';


export function findById(id: string) {
    return db.query.orders.findFirst({ where: eq(orders.id, id) })
}

export function findItemsByOrderId(orderId: string) {
    return db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) })
}


export async function updateStatus(
    id: string,
    values: {
        status?: typeof orders.$inferSelect['status'];
        paymentStatus?: typeof orders.$inferSelect['paymentStatus']
    }
) {
    const [order] = await db
        .update(orders)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
    return order;
}

// Marca como pago SÓ se ainda não estiver pago — a condição no WHERE é a
// guarda atômica. Retorna a linha se transicionou (era não-pago) ou null se
// já estava pago. Isso torna a confirmação idempotente e à prova de
// concorrência: webhook duplicado ou paralelo não roda o efeito duas vezes.
export async function markPaidOnce(
    id: string,
    status?: typeof orders.$inferSelect['status'],
) {
    const [order] = await db
        .update(orders)
        .set({ paymentStatus: 'paid', status, updatedAt: new Date() })
        .where(and(eq(orders.id, id), ne(orders.paymentStatus, 'paid')))
        .returning();
    return order ?? null;
}

export function confirmSkuSale(skuId: string, quantity: number) {
    return db
        .update(productsSkus)
        .set({
            stockQty: sql`GREATEST(${productsSkus.stockQty} - ${quantity}, 0)`,
            reservedQty: sql`GREATEST(${productsSkus.reservedQty} - ${quantity}, 0)`,
            updatedAt: new Date(),
        })
        .where(eq(productsSkus.id, skuId));
}

export function releaseSkuReservation(skuId: string, quantity: number) {
    return db
        .update(productsSkus)
        .set({
            reservedQty: sql`GREATEST(${productsSkus.reservedQty} - ${quantity}, 0)`,
            updatedAt: new Date(),
        })
        .where(eq(productsSkus.id, skuId));
}

export function findUnpaidPendingOrders() {
    return db.query.orders.findMany({
        where: and(eq(orders.status, 'pending'), eq(orders.paymentStatus, 'pending')),
    })
}

export async function cancelIfStillUnpaid(id: string) {
    const [order] = await db
        .update(orders)
        .set({
            status: 'cancelled',
            // payment_status também sai de 'pending' -> senão o pedido expirado
            // continua poluindo a fila "Pendente" do painel para sempre.
            paymentStatus: 'failed',
            updatedAt: new Date(),
        })
        .where(and(
            eq(orders.id, id),
            eq(orders.status, 'pending'),
            eq(orders.paymentStatus, 'pending')
        ))
        .returning();

    return order ?? null;
}

export function findCustomerById(id: string) {
    return db.query.customers.findFirst({
        where: eq(customers.id, id),
        columns: {
            id: true,
            name: true,
            email: true
        },
    });
}

export async function saveShippedAt(orderId: string) {
    const [order] = await db
        .update(orders)
        .set({ shippedAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();
    return order;
}
