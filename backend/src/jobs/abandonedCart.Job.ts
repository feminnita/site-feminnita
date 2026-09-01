import { env } from '../config/env';
import * as AbandonedCartService from '../service/AbandonedCart.Service';

const RUN_EVERY_MS = 30 * 60 * 1000; // a cada 30 min

export function startAbandonedCartJob() {
    if (!env.abandonedCart.enabled) {
        console.log('[abandoned-cart] job DESABILITADO (defina ABANDONED_CART_ENABLED=true para ligar)');
        return;
    }
    console.log('[abandoned-cart] job LIGADO (varredura a cada 30min)');
    setInterval(async () => {
        try {
            const r = await AbandonedCartService.processAbandonedCarts();
            if (r.first || r.second) console.log(`[abandoned-cart] enviados: 1º=${r.first} 2º=${r.second}`);
        } catch (error) {
            console.error('Erro no job de carrinho abandonado:', error);
        }
    }, RUN_EVERY_MS);
}
