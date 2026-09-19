import { env } from '../../config/env';
import { db } from '../../config/db';
import { meTokens } from '../../db/schema';
import { PackageDimensions, RawQuoteOption } from "./types";

/**
 * O token válido é o que o PAINEL renova e grava no banco. A variável ME_TOKEN
 * fica só como rede: uma cópia fixa que não se renova sozinha e um dia vence.
 *
 * Foi o que aconteceu — a cópia do ambiente venceu e a loja parou de cotar
 * frete para TODOS os CEPs, enquanto existia um token bom no banco esse tempo
 * todo. Agora o banco vem primeiro.
 */
async function tokenAtual(): Promise<string> {
    try {
        const [linha] = await db.select().from(meTokens).limit(1);
        if (linha?.accessToken) return linha.accessToken;
    } catch (e) {
        console.error('Nao consegui ler o token do Melhor Envio no banco:', e);
    }
    return env.melhorEnvio.token;
}

async function request<T>(path: string, options: {
    method?: string;
    body?: unknown
} = {}): Promise<T> {
    const response = await fetch(`${env.melhorEnvio.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${await tokenAtual()}`,
            'User-Agent': `Feminnita (${env.store.email})`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`MELHOR_ENVIO_ERROR ${response.status}: ${detail}`);
    }

    return response.json() as Promise<T>;
}

export function calculate(toCep: string, pkg: PackageDimensions): Promise<RawQuoteOption[]> {
    return request<RawQuoteOption[]>('/me/shipment/calculate', {
        method: 'POST',
        body: {
            from: { postal_code: env.store.cep },
            to: { postal_code: toCep },
            package: pkg,
        },
    });
}
