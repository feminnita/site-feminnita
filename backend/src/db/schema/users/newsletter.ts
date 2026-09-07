import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// Lista de e-mails da Feminnita — a base do e-mail marketing próprio, sem
// depender de empresa terceirizada.
//
// `source` diz de onde veio o cadastro (popup, rodapé, checkout): serve para
// medir qual porta traz mais gente e para não mandar o mesmo e-mail duas vezes
// pelo mesmo motivo. `unsubscribedAt` preenchido = pediu para sair; a linha
// FICA, porque apagar faria a pessoa voltar a receber no próximo cadastro.
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    source: text('source').notNull().default('popup'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
});
