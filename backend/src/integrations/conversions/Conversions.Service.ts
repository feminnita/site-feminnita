import { createHash } from 'node:crypto';
import { env } from '../../config/env';

// Conversão de venda PAGA reportada às plataformas SERVER-SIDE, a partir da
// única fonte de verdade (a transição para "pago" no OrderLifecycle). Antes o
// front disparava Purchase na CRIAÇÃO do pedido — contava Pix/boleto não pago
// (~65% não paga) e sem dedup. Aqui dispara UMA vez, só quando pagou de fato,
// cobrindo Pix, boleto e cartão igual.
//
// Tudo é OPCIONAL: sem token da plataforma, ela é pulada em silêncio. Cada
// plataforma tem seu próprio try/catch e NUNCA lança — falha de rede de pixel
// não pode derrubar a confirmação do pagamento.

type PurchaseInput = {
    orderId: string;        // event_id p/ dedup entre plataformas
    orderNumber: string;    // transaction_id legível
    value: number;          // total pago (R$)
    currency: string;       // 'BRL'
    email?: string | null;
    // Telefone e nome entram porque a correspondencia e o que decide se a Meta
    // reconhece a venda. Medido em 26/09: ela contou 4 das 5 compras reais dos
    // ultimos 7 dias — mandando so o e-mail, uma em cada cinco some. E nao e so
    // relatorio: evento que nao casa nao ensina o algoritmo, e a entrega piora.
    phone?: string | null;
    name?: string | null;
    items: Array<{
        productId: string | null;
        productName: string;
        quantity: number;
        unitPrice: number;
    }>;
};

const TIMEOUT_MS = 5000;

function sha256(value: string): string {
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * A Meta so casa o dado se ele chegar normalizado do jeito dela: minusculo, sem
 * espaco, e telefone SO com digitos incluindo o codigo do pais. Hash de um texto
 * fora do padrao nao bate com nada — e falha em silencio, que e o pior tipo.
 */
function telefoneHash(bruto: string): string | null {
    let digitos = bruto.replace(/\D/g, '');
    if (digitos.length < 10) return null;               // nao e telefone
    if (!digitos.startsWith('55')) digitos = `55${digitos}`;
    return createHash('sha256').update(digitos).digest('hex');
}

/** Primeiro e ultimo nome, separados — a Meta casa `fn` e `ln`, nao o nome inteiro. */
function partesDoNome(bruto: string): { fn?: string; ln?: string } {
    const partes = bruto.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return {};
    if (partes.length === 1) return { fn: sha256(partes[0]) };
    return { fn: sha256(partes[0]), ln: sha256(partes[partes.length - 1]) };
}

async function postJson(url: string, body: unknown, headers?: Record<string, string>) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`);
        }
        return res;
    } finally {
        clearTimeout(timer);
    }
}

// client_id do GA4 MP é obrigatório. Sem o do navegador aqui, derivamos um
// estável a partir do pedido — a conversão é contada mesmo sem casar com a
// sessão (a atribuição de verdade vive nos utm_* gravados no próprio pedido).
function ga4ClientId(orderId: string): string {
    const h = createHash('md5').update(orderId).digest('hex');
    const a = parseInt(h.slice(0, 8), 16);
    const b = parseInt(h.slice(8, 16), 16);
    return `${a}.${b}`;
}

async function sendMeta(input: PurchaseInput): Promise<void> {
    const { pixelId, metaToken } = env.conversions.meta;
    if (!pixelId || !metaToken) return;

    // Cada identificador a mais aumenta a chance de a Meta reconhecer a compra.
    // Todos vao com hash — a Meta nunca recebe o dado da cliente em claro.
    const userData: Record<string, unknown> = {};
    if (input.email) userData.em = [sha256(input.email)];
    if (input.phone) {
        const ph = telefoneHash(input.phone);
        if (ph) userData.ph = [ph];
    }
    if (input.name) {
        const { fn, ln } = partesDoNome(input.name);
        if (fn) userData.fn = [fn];
        if (ln) userData.ln = [ln];
    }

    await postJson(
        `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(metaToken)}`,
        {
            data: [
                {
                    event_name: 'Purchase',
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: input.orderId,
                    action_source: 'website',
                    event_source_url: env.clientUrl,
                    user_data: userData,
                    custom_data: {
                        currency: input.currency,
                        value: input.value,
                        content_type: 'product',
                        content_ids: input.items.map((i) => i.productId).filter(Boolean),
                        num_items: input.items.reduce((s, i) => s + i.quantity, 0),
                        order_id: input.orderNumber,
                    },
                },
            ],
        },
    );
}

// Uma sessao por pedido: estavel (o mesmo pedido reenviado nao vira duas
// sessoes) e unica entre pedidos.
function ga4SessionId(orderId: string): string {
    return String(parseInt(createHash('md5').update(`s:${orderId}`).digest('hex').slice(0, 12), 16));
}

async function sendGA4(input: PurchaseInput): Promise<void> {
    const { measurementId, apiSecret } = env.conversions.ga4;
    if (!measurementId || !apiSecret) return;

    await postJson(
        `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
        {
            client_id: ga4ClientId(input.orderId),
            events: [
                {
                    name: 'purchase',
                    params: {
                        // engagement_time_msec e session_id sao OBRIGATORIOS na
                        // pratica. Sem eles o Measurement Protocol responde 204
                        // (aceito) e o evento simplesmente NAO APARECE nos
                        // relatorios do GA4 — nem em Tempo real, nem em
                        // Monetizacao. Era o caso aqui: a compra saia do
                        // servidor, o Google aceitava, e a loja aparecia com
                        // zero venda.
                        //
                        // O Google nao devolve erro nenhum nesse caso, entao o
                        // sintoma e exatamente "nao registra compra" sem pista.
                        engagement_time_msec: 1,
                        session_id: ga4SessionId(input.orderId),
                        transaction_id: input.orderNumber,
                        currency: input.currency,
                        value: input.value,
                        items: input.items.map((i) => ({
                            item_id: i.productId ?? undefined,
                            item_name: i.productName,
                            price: i.unitPrice,
                            quantity: i.quantity,
                        })),
                    },
                },
            ],
        },
    );
}

async function sendTikTok(input: PurchaseInput): Promise<void> {
    const { pixelId, accessToken } = env.conversions.tiktok;
    if (!pixelId || !accessToken) return;

    const user: Record<string, unknown> = {};
    if (input.email) user.email = sha256(input.email);

    await postJson(
        'https://business-api.tiktok.com/open_api/v1.3/event/track/',
        {
            event_source: 'web',
            event_source_id: pixelId,
            data: [
                {
                    event: 'CompletePayment',
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: input.orderId,
                    user,
                    properties: {
                        currency: input.currency,
                        value: input.value,
                        content_type: 'product',
                        contents: input.items.map((i) => ({
                            content_id: i.productId ?? undefined,
                            content_name: i.productName,
                            quantity: i.quantity,
                            price: i.unitPrice,
                        })),
                    },
                },
            ],
        },
        { 'Access-Token': accessToken },
    );
}

// Dispara as 3 em paralelo; cada falha fica no log e não afeta as outras nem o
// pagamento. Retorna sempre resolvido.
export async function sendPurchaseConversions(input: PurchaseInput): Promise<void> {
    const results = await Promise.allSettled([
        sendMeta(input),
        sendGA4(input),
        sendTikTok(input),
    ]);
    const names = ['Meta CAPI', 'GA4', 'TikTok'];
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`Conversão ${names[i]} falhou (pedido ${input.orderNumber}):`, r.reason);
        }
    });
}


/**
 * Diz no log, no boot, o que esta realmente ligado.
 *
 * Este arquivo pula a plataforma em silencio quando falta chave
 * (`if (!pixelId || !metaToken) return;`) — de proposito, para nunca derrubar
 * um pagamento por causa de medicao. O efeito colateral e o pior tipo de erro:
 * a loja roda achando que mede e nao mede, e so se descobre semanas depois,
 * olhando um relatorio vazio.
 *
 * Nunca imprime valor: so LIGADO/DESLIGADO, e para o Meta e o GA4 tambem o que
 * falta, porque quase sempre e uma das duas metades que ficou de fora.
 */
export function relatarConfiguracao(): void {
    const estado = (nome: string, partes: Record<string, string>) => {
        const faltando = Object.entries(partes)
            .filter(([, v]) => !v)
            .map(([k]) => k);
        if (!faltando.length) return `${nome}=LIGADO`;
        if (faltando.length === Object.keys(partes).length) return `${nome}=desligado`;
        return `${nome}=INCOMPLETO (falta ${faltando.join(', ')})`;
    };

    const { meta, ga4, tiktok } = env.conversions;
    console.log(
        '[CONVERSOES] ' +
            [
                estado('meta', { META_PIXEL_ID: meta.pixelId, META_CAPI_TOKEN: meta.metaToken }),
                estado('ga4', { GA4_MEASUREMENT_ID: ga4.measurementId, GA4_API_SECRET: ga4.apiSecret }),
                estado('tiktok', { TIKTOK_PIXEL_ID: tiktok.pixelId, TIKTOK_ACCESS_TOKEN: tiktok.accessToken }),
            ].join(' | '),
    );
}
