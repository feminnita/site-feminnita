import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Token do Melhor Envio, mantido pelo PAINEL: é ele que faz o OAuth e renova
// antes de vencer. A loja só lê.
//
// Antes a loja usava uma cópia fixa em ME_TOKEN, variável do Render, que nunca
// se renovava. Quando essa cópia venceu, a cotação de frete parou para todos os
// CEPs — e a loja ficou sem entrega enquanto existia um token bom no banco,
// renovado pelo painel, a uma consulta de distância.
export const meTokens = pgTable('me_tokens', {
    id: text('id').primaryKey(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    scope: text('scope'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
