import { eq } from 'drizzle-orm';
import { db } from '../config/db';
import { subscribers } from '../db/schema';

export function findByEmail(email: string) {
    return db.query.subscribers.findFirst({ where: eq(subscribers.email, email) });
}

export async function insertPending(input: {
    email: string;
    origin: string;
    confirmToken: string;
    unsubToken: string;
}) {
    const [row] = await db
        .insert(subscribers)
        .values({
            email: input.email,
            origin: input.origin,
            status: 'pendente',
            confirmToken: input.confirmToken,
            unsubToken: input.unsubToken,
        })
        .returning();
    return row;
}

// re-inscrição de quem estava descadastrado: volta a pendente com token novo
export async function reactivatePending(email: string, confirmToken: string) {
    const [row] = await db
        .update(subscribers)
        .set({ status: 'pendente', confirmToken, confirmedAt: null, unsubscribedAt: null, updatedAt: new Date() })
        .where(eq(subscribers.email, email))
        .returning();
    return row;
}

export async function confirmByToken(token: string) {
    const [row] = await db
        .update(subscribers)
        .set({ status: 'confirmado', confirmedAt: new Date(), confirmToken: null, updatedAt: new Date() })
        .where(eq(subscribers.confirmToken, token))
        .returning();
    return row ?? null;
}

export async function unsubscribe(by: { token?: string; email?: string }) {
    const condition = by.token
        ? eq(subscribers.unsubToken, by.token)
        : eq(subscribers.email, (by.email ?? '').toLowerCase());
    const [row] = await db
        .update(subscribers)
        .set({ status: 'descadastrado', unsubscribedAt: new Date(), updatedAt: new Date() })
        .where(condition)
        .returning();
    return row ?? null;
}
