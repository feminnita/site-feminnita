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
    // Cookies do pixel da Meta, lidos no checkout (ver cookiesDaMeta abaixo).
    // Não são guardados aqui — os cookies já duram sozinhos.
    fbp?: string;
    fbc?: string;
    // Cookies do Google Analytics, lidos no checkout (ver cookiesDoGoogle).
    gaClientId?: string;
    gaSessionId?: string;
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

/**
 * Os dois cookies que o pixel da Meta cria: `_fbp` identifica o navegador e
 * `_fbc` guarda o clique no anúncio (nasce do `fbclid` que vem na URL).
 *
 * São o sinal que mais casa a venda com quem viu o anúncio na API de Conversões.
 * Mandando só o e-mail, a Meta reconheceu 4 das 5 vendas reais dos últimos 7
 * dias (medido 26/09) — e evento que não casa com ninguém não ensina o
 * algoritmo: a entrega piora e o resultado fica mais caro.
 *
 * Lidos na hora, não guardados: os próprios cookies já duram (o `_fbp` vive 90
 * dias). Guardar cópia criaria uma segunda verdade para desencontrar da primeira.
 */
function cookiesDaMeta(): { fbp?: string; fbc?: string } {
    if (typeof document === "undefined") return {};
    const achar = (nome: string) =>
        document.cookie
            .split("; ")
            .find((parte) => parte.startsWith(`${nome}=`))
            ?.slice(nome.length + 1) || undefined;
    return { fbp: achar("_fbp"), fbc: achar("_fbc") };
}

/**
 * Visitante e sessão do Google Analytics. A compra é enviada ao GA4 pelo
 * servidor só quando o pagamento confirma; sem estes dois, o servidor tinha de
 * inventar um visitante a partir do pedido, e o GA4 mostrava a venda como
 * "(not set)" — sem saber de qual anúncio ela veio (54 de 55 vendas em 30 dias,
 * medido 08/11).
 *
 * `_ga` = GA1.1.<numero>.<data>  -> visitante = "<numero>.<data>"
 * `_ga_<ID>` = GS1.1.<sessao>.… ou GS2.1.s<sessao>$o…  -> sessão = "<sessao>"
 */
function cookiesDoGoogle(): { gaClientId?: string; gaSessionId?: string } {
    if (typeof document === "undefined") return {};
    const partes = document.cookie.split("; ");
    const valor = (nome: string) =>
        partes.find((p) => p.startsWith(`${nome}=`))?.slice(nome.length + 1);

    const ga = valor("_ga")?.split(".");
    const gaClientId = ga && ga.length >= 4 ? `${ga[ga.length - 2]}.${ga[ga.length - 1]}` : undefined;

    const idStream = (process.env.NEXT_PUBLIC_GA4_ID ?? "").replace(/^G-/, "");
    const sessao =
        (idStream && valor(`_ga_${idStream}`)) ||
        partes.find((p) => p.startsWith("_ga_"))?.split("=")[1];
    const s = sessao?.split(".")[2]?.replace(/^s/, "").split("$")[0];
    const gaSessionId = s && /^\d+$/.test(s) ? s : undefined;

    return {
        gaClientId: gaClientId && /^\d+\.\d+$/.test(gaClientId) ? gaClientId : undefined,
        gaSessionId,
    };
}

// Usada no checkout, para mandar junto com o pedido.
export function origemDaVisita(): OrigemDaVisita {
    const cookies = { ...cookiesDaMeta(), ...cookiesDoGoogle() };
    const o = ler();
    // Sem origem guardada os cookies ainda valem: quem chegou sem utm mas com
    // clique de anúncio continua sendo reconhecido pela Meta.
    if (!o) return cookies;
    const { em: _em, ...resto } = o;
    return { ...resto, ...cookies };
}
