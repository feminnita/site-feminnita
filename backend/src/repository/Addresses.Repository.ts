import { and, desc, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { addresses } from '../db/schema';

type AddressInsert = typeof addresses.$inferInsert;

export function findByCustomerId(customerId: string) {
    return db.query.addresses.findMany({
        where: eq(addresses.customerId, customerId),
        orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)],
    });
}

export function findByIdAndCustomerId(id: string, customerId: string) {
    return db.query.addresses.findFirst({
        where: and(eq(addresses.id, id), eq(addresses.customerId, customerId)),
    });
}

export async function countByCustomerId(customerId: string) {
    const rows = await db.query.addresses.findMany({
        where: eq(addresses.customerId, customerId),
        columns: { id: true },
    });
    return rows.length;
}

export async function insert(values: AddressInsert) {
    const [address] = await db.insert(addresses).values(values).returning();
    return address;
}

export async function updateByIdAndCustomerId(id: string, customerId: string, values: Partial<AddressInsert>) {
    const [address] = await db
        .update(addresses)
        .set(values)
        .where(
            and(
                eq(addresses.id, id),
                eq(addresses.customerId, customerId)
            ))
        .returning();
    return address;
}

export async function deleteByIdAndCustomerId(id: string, customerId: string) {
    const [address] = await db
        .delete(addresses)
        .where(
            and(
                eq(addresses.id, id),
                eq(addresses.customerId, customerId)
            )
        )
        .returning();
    return address;
}

export async function setDefault(id: string, customerId: string) {
    return db.transaction(async (tx) => {
        await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, customerId));

        const [address] = await tx
            .update(addresses)
            .set({ isDefault: true })
            .where(and(
                eq(addresses.id, id),
                eq(addresses.customerId, customerId)
            ))
            .returning();
        return address;
    })
}