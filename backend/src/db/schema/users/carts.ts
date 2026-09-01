import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export type CartItem = {
    productId: string;
    name: string;
    size: string;
    color?: string;
    quantity: number;
    selected?: boolean;
};

export const carts = pgTable('carts', {
    customerId: uuid('customer_id').primaryKey().references(() => customers.id),
    items: jsonb('items').$type<CartItem[]>().notNull().default([]),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    // lembretes de carrinho abandonado (1º toque ~4h, 2º toque ~24h depois)
    firstReminderAt: timestamp('first_reminder_at', { withTimezone: true }),
    secondReminderAt: timestamp('second_reminder_at', { withTimezone: true }),
});
