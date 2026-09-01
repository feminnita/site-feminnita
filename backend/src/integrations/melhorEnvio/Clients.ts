import { env } from '../../config/env';
import { PackageDimensions, RawQuoteOption } from "./types";

async function request<T>(path: string, options: {
    method?: string;
    body?: unknown
} = {}): Promise<T> {
    const response = await fetch(`${env.melhorEnvio.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${env.melhorEnvio.token}`,
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
