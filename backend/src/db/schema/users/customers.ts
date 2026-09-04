import { pgTable, uuid, text, date, timestamp, bigint, integer } from "drizzle-orm/pg-core";


export const customers = pgTable('customers', {
    id: uuid('id').defaultRandom().primaryKey(),
    asaasCustomerId: text('asaas_customer_id'),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    googleId: text('google_id').unique(),
    phone: text('phone'),
    cpf: text('cpf'),
    cnpj: text('cnpj'),
    birthDate: date('birth_date'),
    blingId: bigint('bling_id', { mode: 'number' }),
    // Aceite do Termo de Revenda por conta, versionado. Colunas já aplicadas no banco.
    resaleTermVersion: integer('resale_term_version'),
    resaleTermAcceptedAt: timestamp('resale_term_accepted_at', { withTimezone: true }),
    resaleTermAcceptedIp: text('resale_term_accepted_ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const customerSessions = pgTable('customer_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    userAgent: text('user_agent').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    usedAt: timestamp('use_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});