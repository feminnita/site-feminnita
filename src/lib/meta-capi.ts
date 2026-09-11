// lib/meta-capi.ts — Conversions API (server-side) da Feminnita.
// POR QUÊ: o pixel do navegador perde ~30% dos eventos (iOS/adblock) => Meta reporta ROAS baixo/0
// mesmo com venda. O CAPI manda o evento pelo SERVIDOR (fonte confiável) e recupera esse sinal.
// DEDUP: o pixel do cliente e o CAPI mandam o MESMO evento; o Meta junta os dois pelo `event_id`.
//        => use SEMPRE o mesmo id nos dois lados (aqui: o id do pedido = orders.id).
//
// Requer no .env:  META_PIXEL_ID  e  META_CAPI_TOKEN (ou META_SYSTEM_USER_TOKEN)

import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID || "";
const TOKEN = process.env.META_CAPI_TOKEN || process.env.META_SYSTEM_USER_TOKEN || "";
const API_VERSION = "v21.0";
const TEST_CODE = process.env.META_CAPI_TEST_CODE || ""; // opcional: só pra ver no "Testar eventos" do Events Manager

function sha256(v?: string | null): string | undefined {
  if (!v) return undefined;
  const norm = String(v).trim().toLowerCase();
  if (!norm) return undefined;
  return crypto.createHash("sha256").update(norm).digest("hex");
}

// Telefone: só dígitos, com DDI do Brasil (55). Meta exige E.164 sem "+", hasheado.
function hashPhone(v?: string | null): string | undefined {
  if (!v) return undefined;
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return undefined;
  const withCc = digits.startsWith("55") ? digits : "55" + digits;
  return crypto.createHash("sha256").update(withCc).digest("hex");
}

export type MetaEvent = {
  eventName:
    | "Purchase"
    | "InitiateCheckout"
    | "AddToCart"
    | "ViewContent"
    | "Lead"
    | "CompleteRegistration";
  eventId: string;            // MESMO id do pixel do cliente (aqui: orders.id) => dedup
  eventSourceUrl?: string;    // URL onde aconteceu (ex.: .../pedido-confirmado)
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fbp?: string;               // cookie _fbp (mande do request, melhora o match)
  fbc?: string;               // cookie _fbc (clique do anúncio — MUITO importante p/ atribuição)
  clientIp?: string;          // request.headers 'x-forwarded-for'
  userAgent?: string;         // request.headers 'user-agent'
  value?: number;
  currency?: string;          // default BRL
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
};

export async function sendMetaEvent(
  ev: MetaEvent
): Promise<{ ok: boolean; status: number; body?: any }> {
  if (!PIXEL_ID || !TOKEN) {
    console.warn("[meta-capi] META_PIXEL_ID/token ausente — evento NÃO enviado");
    return { ok: false, status: 0 };
  }

  const user_data: Record<string, any> = {
    em: sha256(ev.email) && [sha256(ev.email)],
    ph: hashPhone(ev.phone) && [hashPhone(ev.phone)],
    fn: sha256(ev.firstName) && [sha256(ev.firstName)],
    ln: sha256(ev.lastName) && [sha256(ev.lastName)],
    fbp: ev.fbp,
    fbc: ev.fbc,
    client_ip_address: ev.clientIp,
    client_user_agent: ev.userAgent,
  };
  Object.keys(user_data).forEach((k) => !user_data[k] && delete user_data[k]);

  const custom_data: Record<string, any> = { currency: ev.currency || "BRL" };
  if (ev.value !== undefined) custom_data.value = Number(Number(ev.value).toFixed(2));
  if (ev.contents?.length) {
    custom_data.contents = ev.contents;
    custom_data.content_ids = ev.contents.map((c) => c.id);
    custom_data.content_type = "product";
  }

  const payload: any = {
    data: [
      {
        event_name: ev.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: "website",
        event_source_url: ev.eventSourceUrl,
        user_data,
        custom_data,
      },
    ],
  };
  if (TEST_CODE) payload.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) console.error("[meta-capi] falhou:", res.status, body);
    return { ok: res.ok, status: res.status, body };
  } catch (e: any) {
    console.error("[meta-capi] erro de rede:", e?.message || e);
    return { ok: false, status: 0 };
  }
}
