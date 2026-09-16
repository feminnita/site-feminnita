import * as OrdeRepository from '../repository/OrderLifecycle.Repository';
import { orderStatusEnum, paymentStatusEnum } from '../db/schema';
import * as EmailService from '../integrations/resend/Services';
import * as CashbackService from './Cashback.Service';
import { sendPurchaseConversions } from '../integrations/conversions/Conversions.Service';


async function confirmSaleForOrder(orderId: string) {

    try {
        const items = await OrdeRepository.findItemsByOrderId(orderId);
        for (const item of items) {
            if (item.skuId) await OrdeRepository.confirmSkuSale(item.skuId, item.quantity);
        }
    } catch (error) {
        console.error(error)
    }
}

async function releaseReservationForOrder(orderId: string) {

    try {
        const items = await OrdeRepository.findItemsByOrderId(orderId);
        for (const item of items) {
            if (item.skuId) await OrdeRepository.releaseSkuReservation(item.skuId, item.quantity);
        }
    } catch (error) {
        console.error(`Falha ao liberar reserva do pedido ${orderId}:`, error);
    }
}

async function sendPaymentConfirmedEmail(order: {
    id: string;
    orderNumber: string;
    total: string;
    customerId: string | null;
}) {

    if (!order.customerId) return;

    const customer = await OrdeRepository.findCustomerById(order.customerId);

    if (!customer) return;

    await EmailService.sendPaymentConfirmed({
        customerName: customer.name,
        customerEmail: customer.email,
        orderNumber: order.orderNumber,
        total: order.total,
    })
}

async function sendOrderShippedEmail(order: {
    id: string;
    orderNumber: string;
    total: string;
    customerId: string | null;
    trackingCode: string | null;
}) {
    if (!order.customerId) return;

    const customer = await OrdeRepository.findCustomerById(order.customerId);
    if (!customer) return;

    await EmailService.sendOrderShipped({
        customerName: customer.name,
        customerEmail: customer.email,
        orderNumber: order.orderNumber,
        total: order.total,
        trackingCode: order.trackingCode,
    });
}

// Reporta a venda PAGA às plataformas (server-side, 1x, só no pago). Roda
// dentro do bloco de transição para "pago" e nunca lança — se um pixel falhar,
// o pedido segue pago e o erro fica no log.
async function reportPurchaseConversion(order: {
    id: string;
    orderNumber: string;
    total: string;
    customerId: string | null;
}) {
    const items = await OrdeRepository.findItemsByOrderId(order.id);
    const customer = order.customerId
        ? await OrdeRepository.findCustomerById(order.customerId)
        : null;

    await sendPurchaseConversions({
        orderId: order.id,
        orderNumber: order.orderNumber,
        value: Number(order.total),
        currency: 'BRL',
        email: customer?.email ?? null,
        items: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
        })),
    });
}

export async function updateOrderStatus(
    id: string,
    input: {
        status?: string;
        paymentStatus?: string;
    }
) {
    if (input.status && !orderStatusEnum.enumValues.includes(input.status as never)) {
        throw new Error('INVALID_STATUS');
    }

    if (input.paymentStatus && !paymentStatusEnum.enumValues.includes(input.paymentStatus as never)) {
        throw new Error('INVALID_PAYMENT_STATUS');
    }

    if (!input.status && !input.paymentStatus) {
        throw new Error('NOTHING_TO_UPDATE');
    }

    const before = await OrdeRepository.findById(id);
    if (!before) throw new Error('ORDER_NOT_FOUND');

    const wasPaid = before.paymentStatus === 'paid';
    const wasCancelled = before.status === 'cancelled';
    const wasShipped = before.status === 'shipped';

    // Guarda de regressão: webhook fora de ordem (at-least-once, não sequencial)
    // não pode tirar um pedido já PAGO de volta para overdue/pending por um
    // evento antigo re-entregue.
    if (wasPaid && (input.paymentStatus === 'overdue' || input.paymentStatus === 'pending')) {
        return before;
    }

    // Transição para PAGO: atômica e idempotente. markPaidOnce só atualiza se
    // ainda não estava pago (condição no WHERE), então estoque e e-mail rodam
    // EXATAMENTE uma vez, mesmo com webhook duplicado ou concorrente.
    if (input.paymentStatus === 'paid') {
        const transitioned = await OrdeRepository.markPaidOnce(
            id,
            input.status as typeof orderStatusEnum.enumValues[number] | undefined,
        );
        if (!transitioned) return before; // já estava pago -> não repete efeito
        await confirmSaleForOrder(transitioned.id);
        // Cashback entra AQUI, dentro do bloco que so roda na transicao: webhook
        // duplicado nao pode dar credito dobrado. Nao pode derrubar a confirmacao
        // do pagamento — se falhar, o pedido segue pago e o erro fica no log.
        await CashbackService.creditarPorPedidoPago(transitioned.id)
            .catch((e) => console.error('Falha ao creditar cashback:', e));
        await sendPaymentConfirmedEmail(transitioned);
        // Conversão de venda paga (Meta/GA4/TikTok) — só aqui, 1x por pedido.
        await reportPurchaseConversion(transitioned)
            .catch((e) => console.error('Falha ao reportar conversão:', e));
        return transitioned;
    }

    const order = await OrdeRepository.updateStatus(id, {
        status: input.status as typeof orderStatusEnum.enumValues[number] | undefined,
        paymentStatus: input.paymentStatus as typeof paymentStatusEnum.enumValues[number] | undefined,
    });

    if (order.status === 'shipped' && !wasShipped) {
        const updated = await OrdeRepository.saveShippedAt(order.id);
        await sendOrderShippedEmail(order);
        return updated;
    } else if (order.status === 'cancelled' && !wasCancelled) {
        // Reserva so volta para o estoque se a venda nunca foi paga.
        if (!wasPaid) await releaseReservationForOrder(order.id);
        // Cashback sai SEMPRE que cancela. Sem isto a cliente recebe o dinheiro
        // de volta E fica com o credito — a loja paga duas vezes pela mesma
        // compra desfeita.
        await CashbackService.estornarPorPedido(order.id)
            .catch((e) => console.error('Falha ao estornar cashback:', e));
    }

    return order;
}

const RESERVATION_TTL_MINUTES: Record<string, number> = {
    pix: 60,
    card: 60,
    boleto: 3 * 24 * 60,
};

const DEFAULT_TTL_MINUTES = 60;

export async function expireStaleOrders() {
    const pendingOrders = await OrdeRepository.findUnpaidPendingOrders();
    const now = Date.now();

    for (const order of pendingOrders) {
        const ttlMinutes = RESERVATION_TTL_MINUTES[order.paymentMethod ?? ''] ?? DEFAULT_TTL_MINUTES;
        const ageMinutes = (now - new Date(order.createdAt!).getTime()) / 60000;

        if (ageMinutes > ttlMinutes) {
            const cancelled = await OrdeRepository.cancelIfStillUnpaid(order.id);

            if (cancelled) {
                await releaseReservationForOrder(order.id);
                console.log(`Pedido ${order.orderNumber} expirado - reserva liberada`)
            }
        }
    }
}
