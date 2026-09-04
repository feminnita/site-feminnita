import * as SiteSettingsRepository from '../repository/SiteSettings.Repository';

export type ResaleTerm = { version: number; content: string; active: boolean };

// Trava de conteúdo vazio: enquanto o texto jurídico (content) não existir, a
// funcionalidade fica TODA desligada automaticamente — sem flag manual. Um termo
// em branco não tem valor jurídico e não pode travar a venda.
export function isResaleTermActive(term: { content?: string | null } | null | undefined): boolean {
    return !!term?.content?.trim();
}

// Lê o Termo de Revenda da settings `resale_term` = { version, content, updatedAt }.
// Fonte única da versão vigente usada no cadastro, no aceite e no gate do checkout.
export async function getCurrentResaleTerm(): Promise<ResaleTerm> {
    const row = await SiteSettingsRepository.findByKey('resale_term');
    const value = (row?.value ?? {}) as { version?: unknown; content?: unknown };

    const version = Number(value.version) || 1;
    const content = typeof value.content === 'string' ? value.content : '';

    return { version, content, active: isResaleTermActive({ content }) };
}
