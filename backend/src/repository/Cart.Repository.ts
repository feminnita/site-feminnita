import { and, eq, isNull, isNotNull, lte, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { carts, customers, CartItem } from '../db/schema';

export type AbandonedCart = {
    customerId: string;
    email: string;
    name: string;
    items: CartItem[];
    updatedAt: Date | null;
};

// stage 1: carrinho com itens, ocioso >= 4h, sem 1º lembrete
// stage 2: já teve 1º lembrete >= 24h atrás, sem 2º lembrete
export async function findAbandonedCarts(stage: 1 | 2): Promise<AbandonedCart[]> {
    const now = Date.now();
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    const conditions = [sql`jsonb_array_length(${carts.items}) > 0`];
    if (stage === 1) {
        conditions.push(lte(carts.updatedAt, fourHoursAgo), isNull(carts.firstReminderAt));
    } else {
        conditions.push(
            isNotNull(carts.firstReminderAt),
            lte(carts.firstReminderAt, twentyFourHoursAgo),
            isNull(carts.secondReminderAt),
        );
    }

    return db
        .select({
            customerId: carts.customerId,
            email: customers.email,
            name: customers.name,
            items: carts.items,
            updatedAt: carts.updatedAt,
        })
        .from(carts)
        .innerJoin(customers, eq(carts.customerId, customers.id))
        .where(and(...conditions));
}

export async function markReminderSent(customerId: string, stage: 1 | 2) {
    const set = stage === 1 ? { firstReminderAt: new Date() } : { secondReminderAt: new Date() };
    return db.update(carts).set(set).where(eq(carts.customerId, customerId));
}

export function findByCustomerId(customerId: string) {
    return db.query.carts.findFirst({
        where: eq(carts.customerId, customerId)
    });
}

export async function upsert(customerId: string, items: CartItem[]) {
    const [cart] = await db
        .insert(carts)
        .values({ customerId, items, updatedAt: new Date() })
        .onConflictDoUpdate({
            target: carts.customerId,
            set: { items, updatedAt: new Date() },
        })
        .returning();
    return cart;
}

export async function deleteByCustomerId(customerId: string) {
    return db.delete(carts).where(eq(carts.customerId, customerId));
}
