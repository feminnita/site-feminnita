import * as AsaasClient from '../asass/Client';
import type { CustomerForCharge, OrderForCharge } from './types';

export async function ensureAsaasCustomer(customer: CustomerForCharge): Promise<string> {
    if (customer.asaasCustomerId) return customer.asaasCustomerId;

    const created = await AsaasClient.createCustomer({
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpf,
        phone: customer.phone ?? undefined,
    });

    return created.id;
}

function isInvalidCustomer(err: unknown): boolean {
    return err instanceof Error && err.message.includes('invalid_customer');
}

// Garante o cliente e cobra, resiliente a asaas_customer_id inválido em produção
// (id criado no sandbox, apagado, ou inconsistente). Se a cobrança falhar com
// invalid_customer, recria o cliente e tenta UMA vez — em vez de derrubar o
// pedido e deixar essa cliente permanentemente impedida de comprar. Retorna o id
// efetivo para o chamador persistir.
export async function createChargeWithCustomer(order: OrderForCharge, customer: CustomerForCharge) {
    let asaasCustomerId = await ensureAsaasCustomer(customer);
    try {
        const result = await createChargeForOrder(order, asaasCustomerId);
        return { ...result, asaasCustomerId };
    } catch (err) {
        if (!isInvalidCustomer(err)) throw err;
        const recreated = await AsaasClient.createCustomer({
            name: customer.name,
            email: customer.email,
            cpfCnpj: customer.cpf,
            phone: customer.phone ?? undefined,
        });
        asaasCustomerId = recreated.id;
        const result = await createChargeForOrder(order, asaasCustomerId);
        return { ...result, asaasCustomerId };
    }
}

function dueDateFor(paymentMethod: string): string {
    const date = new Date();

    if (paymentMethod === 'boleto') date.setDate(date.getDate() + 3);
    return date.toISOString().slice(0, 10);
}

const BILLING_TYPE: Record<string, 'PIX' | 'BOLETO' | 'CREDIT_CARD'> = {
    pix: 'PIX',
    boleto: 'BOLETO',
    card: 'CREDIT_CARD',
};

export async function createChargeForOrder(order: OrderForCharge, asaasCustomerId: string) {

    const isCard = order.paymentMethod === 'card';
    const installmentCount = isCard && order.installments && order.installments > 1 ? order.installments : undefined;

    const payment = await AsaasClient.createPayment({
        customer: asaasCustomerId,
        billingType: BILLING_TYPE[order.paymentMethod] ?? 'PIX',
        value: Number(order.total),
        dueDate: dueDateFor(order.paymentMethod),
        externalReference: order.id,
        description: `Pedido ${order.orderNumber} — Feminnita`,
        ...(installmentCount && { installmentCount, totalValue: Number(order.total) }),
        ...(isCard && {
            creditCard: order.creditCard,
            creditCardHolderInfo: order.holderInfo,
            remoteIp: order.remoteIp,
        }),
    });

    const pixQrCode = order.paymentMethod === 'pix' ? await AsaasClient.getPixQrCode(payment.id) : null;

    return {
        payment,
        pixQrCode
    };
}
