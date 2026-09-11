import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

// O que a loja registra do que acontece nela.
//
// Hoje o unico rastro que existe e o `view_count` do produto: um contador que
// so cresce, sem data, sem sessao, sem origem. Da 173 visualizacoes em 36
// produtos desde sempre — e nao responde nenhuma pergunta util. Nao da para
// saber se foram ontem ou no ano passado, nem quantas pessoas diferentes, nem
// de onde vieram, nem o que procuraram e nao acharam.
//
// Uma linha aqui = uma coisa que uma visitante fez. As telas de marketing
// (visitas, conversao, retencao, busca sem resultado) saem todas desta tabela.
//
// NAO guarda nada que identifique a pessoa. `sessionId` e um numero aleatorio
// criado no navegador dela, que morre quando a aba fecha: serve para saber que
// tres cliques vieram da MESMA visita, e nada mais. Sem nome, sem e-mail, sem
// IP. Quem ja tem conta aparece pelos pedidos, que e outro lugar.
export const storeEvents = pgTable(
    'store_events',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        // Aleatorio, do navegador, por visita. Liga os eventos de uma mesma
        // pessoa dentro da visita sem dizer quem ela e.
        sessionId: text('session_id').notNull(),

        // page_view | product_view | search | add_to_cart | begin_checkout | purchase
        // Texto em vez de enum de propósito: canal novo ou evento novo não deve
        // exigir migração de banco para começar a ser medido.
        type: text('type').notNull(),

        path: text('path'),

        // So em product_view / add_to_cart. Sem FK: se o produto for apagado, o
        // evento continua valendo como historico — e uma FK com cascade apagaria
        // justamente o passado que a tela precisa.
        productId: uuid('product_id'),

        // So em search. `resultCount` = 0 e a tela "Busca sem resultado": o que
        // a cliente procurou e a loja nao tinha.
        term: text('term'),
        resultCount: integer('result_count'),

        // De onde ela veio. Preenchido na primeira pagina da visita.
        referrer: text('referrer'),
        utmSource: text('utm_source'),
        utmMedium: text('utm_medium'),
        utmCampaign: text('utm_campaign'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        // Toda tela pergunta a mesma coisa: "eventos do tipo X no periodo Y".
        tipoPeriodo: index('store_events_tipo_periodo_idx').on(t.type, t.createdAt),
        // Contar visitas distintas e refazer o caminho de uma visita.
        sessao: index('store_events_sessao_idx').on(t.sessionId),
    }),
);
