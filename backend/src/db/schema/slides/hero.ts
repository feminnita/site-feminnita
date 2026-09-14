import { pgTable, pgEnum, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const heroSlidesTypeEnum = pgEnum('hero_slides_type', ['image', 'video']);

export const heroSlides = pgTable('hero_slides', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: heroSlidesTypeEnum('type').notNull(),
    src: text('src').notNull(),
    srcMobile: text('src_mobile'),
    alt: text('alt').notNull(),
    poster: text('poster'),
    ctaText: text('cta_text'),
    ctaHref: text('cta_href'),
    title: text('title'),
    subtitle: text('subtitle'),
    textPosition: text('text_position').default('center-center'),
    // Claro ou escuro do texto. Sem isto a vitrine assumia sempre o mesmo.
    textTheme: text('text_theme').default('light'),

    // Celular tem outra regra, e nao e detalhe: a arte e cortada em outra
    // proporcao, entao o lugar que funciona no desktop cai EM CIMA da modelo.
    // A Chris ja configurava isto no painel e o banco ja guardava — mas este
    // schema nao conhecia as colunas, entao a loja nunca recebia e caia no
    // valor do desktop. Configuracao que existe e nao vale e pior que nao ter:
    // ela mexe, salva, e nada muda.
    textPositionMobile: text('text_position_mobile'),
    textThemeMobile: text('text_theme_mobile'),

    focal: text('focal').default('center'),
    orderIndex: integer('order_index').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});