import * as EventRepository from '../repository/Event.Repository';
import type { NovoEvento } from '../repository/Event.Repository';

// A rota e PUBLICA e anonima — qualquer um na internet pode chamar. Entao o que
// entra e tratado como texto de estranho: tipo tem que estar na lista, tamanho
// e cortado, lote tem teto. Sem isso, um script enche a tabela e as telas de
// marketing passam a mentir.
const TIPOS = new Set([
    'page_view',
    'product_view',
    'search',
    'add_to_cart',
    'begin_checkout',
    'purchase',
]);

const MAX_LOTE = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(v: unknown, max: number): string | null {
    if (typeof v !== 'string') return null;
    const s = v.trim().slice(0, max);
    return s || null;
}

function limpar(bruto: any): NovoEvento | null {
    const sessionId = texto(bruto?.sessionId, 64);
    const type = texto(bruto?.type, 32);
    if (!sessionId || !type || !TIPOS.has(type)) return null;

    // productId só entra se for UUID de verdade: texto solto aqui viraria erro
    // do Postgres e derrubaria o lote inteiro, inclusive os eventos bons.
    const pid = texto(bruto?.productId, 36);

    const n = Number(bruto?.resultCount);

    return {
        sessionId,
        type,
        path: texto(bruto?.path, 300),
        productId: pid && UUID.test(pid) ? pid : null,
        term: texto(bruto?.term, 120),
        resultCount: Number.isInteger(n) && n >= 0 ? n : null,
        referrer: texto(bruto?.referrer, 300),
        utmSource: texto(bruto?.utmSource, 80),
        utmMedium: texto(bruto?.utmMedium, 80),
        utmCampaign: texto(bruto?.utmCampaign, 80),
    };
}

export async function registrar(corpo: any) {
    const lista = Array.isArray(corpo?.events) ? corpo.events : [corpo];
    const limpos = lista.slice(0, MAX_LOTE).map(limpar).filter(Boolean) as NovoEvento[];
    const gravados = await EventRepository.registrar(limpos);
    // Devolve quantos entraram e quantos foram recusados — sem isso, evento
    // malformado sumiria em silencio e a tela ficaria vazia sem explicacao.
    return { gravados, recusados: lista.length - limpos.length };
}
