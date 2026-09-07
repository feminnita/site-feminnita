// Guarda de onde a pessoa veio, para o pedido saber qual campanha e QUAL ARTE
// geraram a venda.
//
// Por que guardar em vez de ler na hora do checkout: quem clica no anúncio cai
// numa página com ?utm_campaign=... , depois navega, e no checkout a URL já não
// tem mais nada. Sem guardar na chegada, a origem se perde no primeiro clique.
//
// Regra da primeira: mantém a origem da PRIMEIRA visita da sessão de compra. Se
// a pessoa vem pelo anúncio, sai, e volta pelo Google, quem trouxe a venda foi o
// anúncio. Uma origem nova só substitui quando a anterior expirou.
const CHAVE = "feminnita:origem";
const VALIDADE_DIAS = 30;

export type OrigemDaVisita = {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    landingPage?: string;
    referrer?: string;
    em?: number;
};

function ler(): OrigemDaVisita | null {
    try {
        const cru = localStorage.getItem(CHAVE);
        if (!cru) return null;
        const o = JSON.parse(cru) as OrigemDaVisita;
        if (o.em && Date.now() - o.em > VALIDADE_DIAS * 864e5) return null;
        return o;
    } catch {
        return null;
    }
}

// Chamada uma vez quando a loja abre.
export function registrarOrigem() {
    if (typeof window === "undefined") return;

    const p = new URLSearchParams(window.location.search);
    const daUrl = {
        utmSource: p.get("utm_source") || undefined,
        utmMedium: p.get("utm_medium") || undefined,
        utmCampaign: p.get("utm_campaign") || undefined,
        utmContent: p.get("utm_content") || undefined,
        utmTerm: p.get("utm_term") || undefined,
    };

    const temUtm = Object.values(daUrl).some(Boolean);
    const jaGuardada = ler();

    // Já existe origem válida e esta visita não traz nada novo: não sobrescreve.
    if (jaGuardada && !temUtm) return;

    // Referência externa (Instagram, Google) só entra quando não há utm: um
    // anúncio identificado vale mais do que "veio do instagram.com".
    const referrer =
        !temUtm && document.referrer && !document.referrer.includes(window.location.host)
            ? document.referrer
            : undefined;

    if (!temUtm && !referrer) return;

    try {
        localStorage.setItem(
            CHAVE,
            JSON.stringify({
                ...daUrl,
                referrer,
                landingPage: window.location.pathname,
                em: Date.now(),
            } satisfies OrigemDaVisita),
        );
    } catch {
        /* navegador anônimo ou storage bloqueado: a venda acontece do mesmo jeito */
    }
}

// Usada no checkout, para mandar junto com o pedido.
export function origemDaVisita(): OrigemDaVisita {
    const o = ler();
    if (!o) return {};
    const { em: _em, ...resto } = o;
    return resto;
}
