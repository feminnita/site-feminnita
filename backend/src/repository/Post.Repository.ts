import { and, desc, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { posts } from '../db/schema';

// Só o que está publicado sai daqui. Rascunho — inclusive história de cliente
// esperando aprovação — nunca vaza para a loja.
const publicado = eq(posts.status, 'publicado');

// A listagem não devolve o corpo do texto: seriam dezenas de KB por artigo
// numa tela que só mostra título e chamada.
const naListagem = {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    coverUrl: true,
    kind: true,
    access: true,
    authorName: true,
    publishedAt: true,
} as const;

export function findMany(access: string, kind?: string) {
    return db.query.posts.findMany({
        where: kind
            ? and(publicado, eq(posts.access, access), eq(posts.kind, kind))
            : and(publicado, eq(posts.access, access)),
        columns: naListagem,
        orderBy: [desc(posts.publishedAt)],
    });
}

export function findBySlug(slug: string, access: string) {
    return db.query.posts.findFirst({
        where: and(publicado, eq(posts.slug, slug), eq(posts.access, access)),
    });
}

export function insertStory(values: {
    slug: string;
    title: string;
    body: string;
    authorName: string;
    authorCustomerId: string;
}) {
    // Nasce como rascunho de propósito: história de cliente só vai ao ar
    // depois que alguém da Feminnita ler.
    return db
        .insert(posts)
        .values({ ...values, kind: 'historia', access: 'publico', status: 'rascunho' })
        .returning({ id: posts.id });
}
