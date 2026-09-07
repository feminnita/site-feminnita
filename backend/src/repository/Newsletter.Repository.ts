import { eq, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { newsletterSubscribers } from '../db/schema';

// Cadastro na lista. Se o e-mail já existe, NÃO duplica e NÃO derruba o cadastro
// antigo: só reativa quem tinha saído e atualiza o nome, se veio um.
export async function subscribe(input: { email: string; name?: string | null; source?: string }) {
    const [row] = await db
        .insert(newsletterSubscribers)
        .values({
            email: input.email,
            name: input.name ?? null,
            source: input.source || 'popup',
        })
        .onConflictDoUpdate({
            target: newsletterSubscribers.email,
            set: {
                unsubscribedAt: sql`null`,
                name: sql`coalesce(${input.name ?? null}, ${newsletterSubscribers.name})`,
            },
        })
        .returning({ id: newsletterSubscribers.id });
    return row;
}

export async function unsubscribe(email: string) {
    await db
        .update(newsletterSubscribers)
        .set({ unsubscribedAt: new Date() })
        .where(eq(newsletterSubscribers.email, email));
}
