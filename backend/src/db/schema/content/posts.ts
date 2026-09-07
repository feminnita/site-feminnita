import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { customers } from '../users/customers';

// Conteúdo da Feminnita: artigo do blog, aula de treinamento e história de
// cliente sao a MESMA coisa — titulo, capa, texto, video, anexo. O que muda e
// quem pode ler (`access`) e onde aparece (`kind`). Uma tabela so, para nao
// manter tres CRUDs identicos.
//
// `access`:
//   'publico'     — blog aberto, e o que o Google indexa
//   'revendedora' — so para cliente logado com acesso liberado
//
// `kind`:
//   'artigo'   — post do blog
//   'aula'     — treinamento de vendas
//   'historia' — historia mandada por uma cliente
//
// `status` fica 'rascunho' ate alguem publicar. Historia de cliente NASCE como
// rascunho: ninguem publica no site da Feminnita sem a Chris ler antes.
export const posts = pgTable(
    'posts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        slug: text('slug').notNull().unique(),
        title: text('title').notNull(),
        excerpt: text('excerpt'),
        coverUrl: text('cover_url'),
        body: text('body').notNull().default(''),

        access: text('access').notNull().default('publico'),
        kind: text('kind').notNull().default('artigo'),
        // Categoria editorial (Treinamento, Tecidos & Produtos, Bem-Estar & Sono,
        // Datas Especiais). Cada uma tem cor propria na tela — era isso que dava
        // ao blog antigo cara de revista em vez de lista de links.
        category: text('category'),
        status: text('status').notNull().default('rascunho'),

        // Video fica no YouTube nao listado: nao custa hospedagem e aguenta
        // qualquer numero de alunas.
        videoUrl: text('video_url'),
        attachmentUrl: text('attachment_url'),

        authorName: text('author_name'),
        // Preenchido quando quem escreveu foi uma cliente, para dar o credito
        // e para conseguir avisa-la quando o texto dela for publicado.
        authorCustomerId: uuid('author_customer_id').references(() => customers.id, {
            onDelete: 'set null',
        }),

        publishedAt: timestamp('published_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (t) => ({
        // A listagem sempre filtra por essas tres colunas juntas.
        listagem: index('posts_listagem_idx').on(t.status, t.access, t.kind),
    }),
);
