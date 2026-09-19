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

/**
 * Transportadoras que a loja pede na cotacao.
 *
 * Sem esta lista, a API do Melhor Envio devolve UMA opcao so — a JeT. Nao e
 * limite da conta: pedindo explicitamente, a mesma conta e o mesmo CEP
 * respondem Loggi, Jadlog, Correios SEDEX e outras, mais baratas inclusive. A
 * cliente estava escolhendo entre uma opcao so, sem saber que havia outras.
 *
 * A lista vem da conta, nao do codigo: habilitar uma transportadora nova no
 * Melhor Envio passa a valer na loja sozinho, sem deploy. Guardada em memoria
 * por 6h porque muda raramente e a cotacao roda a cada CEP digitado.
 */
const SEIS_HORAS = 6 * 60 * 60 * 1000;

// Rede para o dia em que a listagem falhar: sao os ids de hoje da conta da
// Feminnita. Melhor cotar com a lista de ontem do que voltar a mostrar so uma.
const SERVICOS_DE_RESERVA = [1, 2, 3, 4, 12, 15, 16, 17, 22, 27, 31, 32, 33, 34, 35];

let servicosEmCache: { ids: number[]; quando: number } | null = null;

async function servicosDaConta(): Promise<number[]> {
    if (servicosEmCache && Date.now() - servicosEmCache.quando < SEIS_HORAS) {
        return servicosEmCache.ids;
    }

    try {
        const lista = await request<{ id: number }[]>('/me/shipment/services');
        const ids = (Array.isArray(lista) ? lista : [])
            .map((s) => s.id)
            .filter((id) => Number.isFinite(id));
        if (ids.length) {
            servicosEmCache = { ids, quando: Date.now() };
            return ids;
        }
    } catch (erro) {
        console.error('Nao consegui listar os servicos do Melhor Envio:', erro);
    }

    return servicosEmCache?.ids ?? SERVICOS_DE_RESERVA;
}

export async function calculate(
    toCep: string,
    pkg: PackageDimensions,
): Promise<RawQuoteOption[]> {
    const servicos = await servicosDaConta();

    return request<RawQuoteOption[]>('/me/shipment/calculate', {
        method: 'POST',
        body: {
            from: { postal_code: env.store.cep },
            to: { postal_code: toCep },
            package: pkg,
            services: servicos.join(','),
        },
    });
}
