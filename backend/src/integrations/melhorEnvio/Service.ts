import * as MelhorEnvio from '../melhorEnvio/Clients';
import { computePackage } from '../melhorEnvio/Domain';
import type { PackableItem, ShippingQuoteOption } from './types';

export type QuotableItem = PackableItem;

// Opção sintética de "Frete sob consulta" (pedido volumoso: 3+ volumes).
// Não é serviço do Melhor Envio. Id negativo que nunca colide com serviço real
// nem com a retirada (-1). O backend reconhece esse id ao criar o pedido, não
// cota o ME, zera o frete e marca o pedido como "a combinar".
export const SOB_CONSULTA_ID = -2;
export const SOB_CONSULTA_METHOD = 'Frete sob consulta';

// Combina as cotações de N volumes num único conjunto de opções: só mantém os
// serviços disponíveis (sem erro) em TODOS os volumes; soma os preços e usa o
// maior prazo entre os volumes.
function combineVolumeQuotes(perVolume: ShippingQuoteOption[][]): ShippingQuoteOption[] {
    if (perVolume.length === 0) return [];
    const [first, ...rest] = perVolume;

    return first
        .map((option) => {
            let price = Number(option.price);
            let deliveryDays = option.deliveryDays;

            for (const volumeOptions of rest) {
                const match = volumeOptions.find((o) => o.id === option.id);
                if (!match) return null;
                price += Number(match.price);
                deliveryDays = Math.max(deliveryDays, match.deliveryDays);
            }

            return { ...option, price: price.toFixed(2), deliveryDays };
        })
        .filter((o): o is ShippingQuoteOption => o !== null);
}

export async function quoteShipping(toCep: string, items: QuotableItem[]): Promise<ShippingQuoteOption[]> {
    const pkg = computePackage(items);

    // 3+ volumes: não cota transportadora. Devolve a opção "sob consulta" para o
    // checkout deixar a compra seguir e a operação cotar a coleta depois.
    if (pkg.sobConsulta) {
        return [
            {
                id: SOB_CONSULTA_ID,
                name: SOB_CONSULTA_METHOD,
                company: '',
                price: '0.00',
                deliveryDays: 0,
            },
        ];
    }

    // 1 ou 2 volumes: cota cada volume no ME e combina.
    const perVolume = await Promise.all(pkg.volumes.map((volume) => MelhorEnvio.calculate(toCep, volume)));

    const mapped = perVolume.map((rawOptions) =>
        rawOptions
            .filter((option) => !option.error && option.price)
            .map((option) => ({
                id: option.id,
                name: option.name,
                company: option.company?.name ?? '',
                price: option.price!,
                deliveryDays: option.delivery_time ?? 0,
            })),
    );

    return combineVolumeQuotes(mapped);
}
