import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// origin: 'popup' | 'checkout' | 'bling'
// status: 'pendente' | 'confirmado' | 'descadastrado'  (double opt-in)
export const subscribers = pgTable('subscribers', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    origin: text('origin').notNull(),
    status: text('status').notNull().default('pendente'),
    confirmToken: text('confirm_token'),
    unsubToken: text('unsub_token'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Subscriber = typeof subscribers.$inferSelect;
