// Manda para o servidor o que acontece na loja: visita de pagina, produto
// aberto, busca feita.
//
// Hoje o unico rastro e o contador view_count do produto — um numero que so
// cresce, sem data e sem sessao. Nao responde "quantas pessoas", "quando",
// "de onde vieram" nem "o que procuraram e nao acharam". Daqui saem as telas
// de marketing.
//
// Tres regras que o codigo respeita:
//   1. medicao nunca quebra a loja — todo erro e engolido;
//   2. nada identifica a pessoa — a sessao e um numero aleatorio que morre com
//      a aba;
//   3. manda em lote, nao a cada clique, para nao fazer a loja esperar.
import { origemDaVisita } from "./origemDaVisita";
import { API_URL } from "../services/api";

export type TipoEvento =
    | "page_view"
    | "product_view"
    | "search"
    | "add_to_cart"
    | "begin_checkout"
    | "purchase";

type Evento = {
    sessionId: string;
    type: TipoEvento;
    path?: string;
    productId?: string;
    term?: string;
    resultCount?: number;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
};

const CHAVE_SESSAO = "feminnita:sessao";
const ESPERA_MS = 3000;
const LOTE_MAX = 20;

// Reserva para quando o navegador bloqueia storage (janela anonima, cookies
// desligados). Sem ela, TODA visita bloqueada viraria a mesma "sessao" e a
// contagem de visitantes ficaria errada para baixo.
let sessaoNaMemoria = "";

function novoId(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `s${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    }
}

function sessao(): string {
    if (!sessaoNaMemoria) sessaoNaMemoria = novoId();
    try {
        const guardada = sessionStorage.getItem(CHAVE_SESSAO);
        if (guardada) return guardada;
        sessionStorage.setItem(CHAVE_SESSAO, sessaoNaMemoria);
    } catch {
        /* storage bloqueado: segue com o id da memoria */
    }
    return sessaoNaMemoria;
}

let fila: Evento[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let ouvindo = false;

function enviar() {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    if (!fila.length) return;

    const lote = fila.splice(0, LOTE_MAX);
    const corpo = JSON.stringify({ events: lote });
    const url = `${API_URL}/api/store/events`;

    try {
        // sendBeacon e o unico jeito que sobrevive a aba fechando — fetch comum
        // e cancelado no meio e o ultimo lote da visita se perderia, justo o que
        // tem a saida da pessoa.
        const blob = new Blob([corpo], { type: "application/json" });
        if (navigator.sendBeacon?.(url, blob)) return;
    } catch {
        /* cai no fetch abaixo */
    }

    try {
        void fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: corpo,
            keepalive: true,
        }).catch(() => { });
    } catch {
        /* medicao nunca quebra a loja */
    }
}

function ouvirSaida() {
    if (ouvindo || typeof document === "undefined") return;
    ouvindo = true;
    // visibilitychange cobre o caso do celular, onde a aba some sem disparar
    // unload; pagehide cobre o Safari. Os dois juntos porque nenhum sozinho
    // pega todos os navegadores.
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") enviar();
    });
    window.addEventListener("pagehide", enviar);
}

export function registrar(type: TipoEvento, dados: Partial<Evento> = {}) {
    if (typeof window === "undefined") return;
    try {
        const o = origemDaVisita();
        fila.push({
            sessionId: sessao(),
            type,
            path: window.location.pathname,
            referrer: o.referrer,
            utmSource: o.utmSource,
            utmMedium: o.utmMedium,
            utmCampaign: o.utmCampaign,
            ...dados,
        });
        ouvirSaida();
        if (fila.length >= LOTE_MAX) return enviar();
        if (!timer) timer = setTimeout(enviar, ESPERA_MS);
    } catch {
        /* medicao nunca quebra a loja */
    }
}

// A busca roda a cada tecla digitada. Sem segurar, "pijama" viraria seis
// eventos ("p", "pi", "pij"...) e a tela de busca sem resultado encheria de
// palavra pela metade — que e exatamente o dado que ela NAO pode mostrar.
const BUSCA_ESPERA_MS = 1200;
const BUSCA_MIN_LETRAS = 3;
let buscaTimer: ReturnType<typeof setTimeout> | null = null;
const buscasJaEnviadas = new Set<string>();

export function registrarBusca(termo: string, resultados: number) {
    const t = termo.trim();
    if (buscaTimer) clearTimeout(buscaTimer);
    if (t.length < BUSCA_MIN_LETRAS) return;

    buscaTimer = setTimeout(() => {
        const chave = t.toLowerCase();
        // Uma vez por termo por visita: quem volta na aba da busca nao conta de novo.
        if (buscasJaEnviadas.has(chave)) return;
        buscasJaEnviadas.add(chave);
        registrar("search", { term: t, resultCount: resultados });
    }, BUSCA_ESPERA_MS);
}
