import { pgTable, pgEnum, uuid, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const couponTypeEnum = pgEnum('coupon_type', ['percent', 'fixed']);

export const coupons = pgTable('coupons', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    type: couponTypeEnum('type').notNull(),
    value: numeric('value', { precision: 10, scale: 2 }).notNull(),
    minOrderValue: numeric('min_order_value', { precision: 10, scale: 2 }),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    active: boolean('active').notNull().default(true),
    /**
     * So vale para quem NUNCA comprou.
     *
     * A trava que existia perguntava "esta cliente ja usou ESTE cupom?", e
     * isso nao segura desconto de primeira compra: quem comprou com o de 3%
     * pegaria o de 6% normalmente, porque e outro cupom. A Chris viu o buraco
     * antes de ele existir — "ele pega o macete e vai ficar esperando esses
     * 3% toda vez". Desconto que se repete deixa de ser incentivo e vira
     * tabela de preco.
     *
     * A conferencia e por CLIENTE, e a cliente e resolvida pelo e-mail mesmo
     * sem conta: comprar como visitante nao escapa da regra.
     */
    firstPurchaseOnly: boolean('first_purchase_only').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});