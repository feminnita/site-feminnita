import * as AdminOrderService from '../service/OrderLifecycle.Service';

const RUN_EVERY_MS = 60_000;

export function startExpireOrderJob() {
    setInterval(async () => {
        try {
            await AdminOrderService.expireStaleOrders();
        } catch (error) {
            console.error('Erro no job de expiração de pedidos:', error);
        }
    }, RUN_EVERY_MS);
}