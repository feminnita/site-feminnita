import { Request, Response } from 'express';
import * as OrdeRepository from '../repository/Order.Repository';
import * as SiteSettingsRepository from '../repository/SiteSettings.Repository';
import * as MelhorEnvio from '../integrations/melhorEnvio/Service';
import type { ShippingConfig } from '../types/shipping';


export async function quote(req: Request, res: Response) {

    try {
        const { cep, items } = req.body as { cep?: string; items?: { productId: string; quantity: number }[] };

        if (!cep || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Informe cep e items'
            });
        }

        const products = await OrdeRepository.findProductsByIds(items.map((i) => i.productId));

        const productById = new Map(products.map((p) => [p.id, p]));

        let subtotal = 0;

        const quotable = items.map((item) => {
            const product = productById.get(item.productId);

            if (!product) throw new Error(`Product_NOT_FOUND: ${item.productId}`);

            subtotal += Number(product.salePrice ?? product.basePrice) * item.quantity;

            return {
                weightKg: product.weightKg,
                pkgHeightCm: product.pkgHeightCm,
                pkgWidthCm: product.pkgWidthCm,
                pkgLengthCm: product.pkgLengthCm,
                quantity: item.quantity,
                ref: product.id,
            };
        });

        let options = await MelhorEnvio.quoteShipping(cep, quotable);

        const configRow = await SiteSettingsRepository.findByKey('shipping_config');
        const config = (configRow?.value ?? {}) as ShippingConfig;
        const extraDays = Number(config.extraDays) || 0;

        if (extraDays > 0) {
            options = options.map((o) => ({
                ...o,
                deliveryDays: o.deliveryDays + extraDays,
            }));
        }

        const threshold = Number(config.freeShippingThreshold) || 0;
        if (threshold > 0 && subtotal >= threshold && options.length > 0) {
            const cheapest = options.reduce(
                (best, o, i) => (Number(o.price) < Number(options[best].price) ? i : best),
                0,
            );
            options = options.map((o, i) =>
                i === cheapest ? { ...o, price: '0.00' } : o,
            );
        }

        res.json(options);
    } catch (error) {
        console.error('Erro na cotação de frete: ', error);
        res.status(500).json({ error: 'Não foi possível cotar o frete agora' });
    }
}