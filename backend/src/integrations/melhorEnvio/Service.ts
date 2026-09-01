import * as MelhorEnvio from '../melhorEnvio/Clients';
import { combinePackage } from '../melhorEnvio/Domain';
import type { ShippingQuoteOption } from './types';

export type QuotableItem = Parameters<typeof combinePackage>[0][number];

export async function quoteShipping(toCep: string, items: QuotableItem[]): Promise<ShippingQuoteOption[]> {
    const pkg = combinePackage(items);
    const rawOptions = await MelhorEnvio.calculate(toCep, pkg);

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
