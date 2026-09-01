import { timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import * as AdminOrderService from '../../service/OrderLifecycle.Service';
import { env } from '../../config/env';

const EVENT_MAP: Record<string, { paymentStatus: string; status?: string }> = {
    PAYMENT_RECEIVED: { paymentStatus: 'paid', status: 'confirmed' },
    PAYMENT_CONFIRMED: { paymentStatus: 'paid', status: 'confirmed' },
    PAYMENT_OVERDUE: { paymentStatus: 'overdue' },
    PAYMENT_REFUNDED: { paymentStatus: 'refunded', status: 'cancelled' },
    PAYMENT_CHARGEBACK_REQUESTED: { paymentStatus: 'disputed' },
};

function isValidToken(received: unknown): boolean {
    if (typeof received !== 'string' || !env.asaas.webhookToken) return false;

    const a = Buffer.from(received);
    const b = Buffer.from(env.asaas.webhookToken);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
}

export async function handleAsaasEvent(req: Request, res: Response) {
    if (!isValidToken(req.headers['asaas-access-token'])) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    const event = req.body?.event as string | undefined;
    const orderId = req.body?.payment?.externalReference as string | undefined;

    const transition = event ? EVENT_MAP[event] : undefined;
    if (!transition || !orderId) {
        return res.status(200).json({ received: true, ignored: true });
    }

    try {
        await AdminOrderService.updateOrderStatus(orderId, transition);
        return res.status(200).json({ received: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
            console.error(`Webhook Asaas: pedido ${orderId} não encontrado (evento ${event})`);
            return res.status(200).json({ received: true, ignored: true });
        }
        console.error(`Webhook Asaas: erro ao processar ${event} do pedido ${orderId}:`, error);
        return res.status(500).json({ error: 'Erro interno' });
    }
}
