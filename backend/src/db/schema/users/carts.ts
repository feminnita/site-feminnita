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
    // Quando o lembrete de carrinho abandonado foi enviado. Preenchido = ja
    // avisamos; a pessoa nao recebe de novo pelo mesmo carrinho. Volta a null
    // quando ela mexe no carrinho outra vez.
    abandonedEmailAt: timestamp('abandoned_email_at', { withTimezone: true }),
});
