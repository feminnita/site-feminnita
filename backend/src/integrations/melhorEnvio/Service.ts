import * as MelhorEnvio from '../melhorEnvio/Clients';
import { combinePackage } from '../melhorEnvio/Domain';
import type { ShippingQuoteOption } from './types';

export type QuotableItem = Parameters<typeof combinePackage>[0][number];

export async function quoteShipping(toCep: string, items: QuotableItem[]): Promise<ShippingQuoteOption[]> {
    const pkg = combinePackage(items);
    const resposta = await MelhorEnvio.calculate(toCep, pkg);

    // O Melhor Envio nem sempre devolve uma LISTA: quando sobra uma
    // transportadora só, vem o objeto sozinho. O `.filter` abaixo estourava,
    // o erro subia até o controller e o checkout ficava sem NENHUMA opção —
    // inclusive sem a retirada na fábrica, que nem depende de transportadora.
    const rawOptions = Array.isArray(resposta) ? resposta : [resposta];

    return rawOptions
        .filter((option) => !option.error && option.price)
        .map((option) => ({
            id: option.id,
            name: option.name,
            company: option.company?.name ?? '',
            price: option.price!,
            deliveryDays: option.delivery_time ?? 0,
        }));
}
