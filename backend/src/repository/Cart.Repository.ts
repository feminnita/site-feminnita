import { eq } from 'drizzle-orm';
import { db } from '../config/db';
import { carts, CartItem } from '../db/schema';

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
