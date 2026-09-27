import { eq, notInArray } from 'drizzle-orm';
import { db } from '../config/db';
import { siteSettings } from '../db/schema';

/**
 * Chaves que a tabela guarda mas a vitrine nunca usa.
 *
 * `bling_id_backup` e um mapa de vinculo produto->Bling que o painel grava por
 * seguranca. Em 27/09/2026 ele estava com 251 kB dos 258 kB da resposta desta
 * rota -- 97% do peso -- e a rota e publica, chamada em TODA visita da loja.
 * Era o maior consumidor de banda do servico no Render e de transferencia no
 * Neon, para um dado que o navegador da cliente joga fora.
 *
 * Cortar aqui, e nao no controller, e de proposito: assim os bytes nao saem do
 * Postgres.
 */
const CHAVES_INTERNAS = ['bling_id_backup'];

export function findAll() {
    return db.query.siteSettings.findMany({
        where: notInArray(siteSettings.key, CHAVES_INTERNAS),
    });
}

export function findByKey(key: string) {
    return db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, key),
    });
}
