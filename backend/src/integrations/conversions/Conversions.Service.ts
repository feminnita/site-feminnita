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

    const userData: Record<string, unknown> = {};
    if (input.email) userData.em = [sha256(input.email)];

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
