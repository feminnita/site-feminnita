import { apiGet, apiPost } from "./api";

export type ResaleTerm = { version: number; content: string; active: boolean };

export function getResaleTerm(): Promise<ResaleTerm | null> {
    return apiGet<ResaleTerm>("/api/store/resale-term");
}

// Trava de conteúdo vazio: funcionalidade só liga quando há texto no termo.
export function isResaleTermActive(term: ResaleTerm | null | undefined): boolean {
    return !!term?.content?.trim();
}

export async function acceptResaleTerm(): Promise<{ ok: boolean; version: number }> {
    return (await apiPost<{ ok: boolean; version: number }>(
        "/api/store/resale-term/accept",
    )) as { ok: boolean; version: number };
}

// Extrai a versão vigente da mensagem de erro RESALE_TERM_REACCEPT_REQUIRED:<n>
// devolvida pelo backend quando o termo mudou desde o último aceite do cliente.
export function parseReacceptVersion(rawMessage: string): number | null {
    const match = rawMessage.match(/RESALE_TERM_REACCEPT_REQUIRED:(\d+)/);
    return match ? Number(match[1]) : null;
}
