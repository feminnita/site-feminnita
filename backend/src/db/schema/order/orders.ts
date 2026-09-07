import { pgTable, pgEnum, uuid, text, numeric, timestamp, integer, jsonb, bigint, uniqueIndex } from 'drizzle-orm/pg-core';
import { customers } from '../users/customers';
import { coupons } from './coupons';

export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled',]);

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'overdue', 'refunded', 'disputed',]);

export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    customerId: uuid('customer_id').references(() => customers.id),
    status: orderStatusEnum('status').notNull().default('pending'),
    paymentMethod: text('payment_method'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).default('0'),
    discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    shippingAddress: jsonb('shipping_address').$type<Record<string, unknown>>(),
    notes: text('notes'),
    couponId: uuid('coupon_id').references(() => coupons.id),
    couponCode: text('coupon_code'),
    asaasPaymentId: text('asaas_payment_id'),
    affiliateCode: text('affiliate_code'),
    meOrderId: text('me_order_id'),
    labelUrl: text('label_url'),
    labelGeneratedAt: timestamp('label_generated_at', { withTimezone: true }),
    trackingCode: text('tracking_code'),
    trackingUrl: text('tracking_url'),
    shippingServiceId: integer('shipping_service_id'),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    refCreator: text('ref_creator'),
    blingOrderId: bigint('bling_order_id', { mode: 'number' }),
    installments: integer('installments'),
    shippingMethod: text('shipping_method'),
    // Versão vigente do Termo de Revenda aceita no momento do pedido. Coluna já aplicada no banco.
    resaleTermVersion: integer('resale_term_version'),

    // De onde veio a visita que virou este pedido. Anúncio traz isso na URL
    // (utm_source, utm_campaign, utm_content) e a loja jogava fora — então não
    // havia como saber qual campanha, e principalmente QUAL ARTE, gerou venda.
    //
    // Guardar aqui mede a venda de verdade, não a conversão que a plataforma diz
    // ter feito. E não depende de token de API que vence.
    // `utmContent` costuma identificar o criativo; `utmTerm`, a palavra-chave.
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    utmTerm: text('utm_term'),
    // Página de entrada e de onde a pessoa veio quando não há utm (busca
    // orgânica, link no Instagram, indicação).
    landingPage: text('landing_page'),
    referrer: text('referrer'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    customerCouponUnique: uniqueIndex('orders_customer_coupon_unique')
        .on(table.customerId, table.couponId),
}));