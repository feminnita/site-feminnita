import * as CartRepository from '../repository/Cart.Repository';
import * as OrderRepository from '../repository/Order.Repository';
import * as EmailService from '../integrations/resend/Services';
import { env } from '../config/env';

// "não manda para quem já comprou": pula se o cliente fez um pedido DEPOIS de mexer no
// carrinho pela última vez (ou seja, converteu este carrinho). Repeat-buyer com carrinho
// novo abandonado ainda é notificado — o que é o desejado.
async function converted(customerId: string, cartUpdatedAt: Date | null): Promise<boolean> {
    const orders = await OrderRepository.findOrdersByCustomerId(customerId);
    if (orders.length === 0) return false;
    if (!cartUpdatedAt) return true;
    return orders.some((o) => o.createdAt != null && o.createdAt >= cartUpdatedAt);
}

async function processStage(stage: 1 | 2): Promise<number> {
    const carts = await CartRepository.findAbandonedCarts(stage);
    let sent = 0;
    for (const cart of carts) {
        if (await converted(cart.customerId, cart.updatedAt)) continue;
        await EmailService.sendAbandonedCart({
            customerName: cart.name,
            customerEmail: cart.email,
            items: cart.items.map((i) => ({ name: i.name, quantity: i.quantity })),
            cartUrl: `${env.clientUrl}/carrinho`,
            unsubscribeUrl: `${env.apiUrl}/api/store/newsletter/unsubscribe?email=${encodeURIComponent(cart.email)}`,
        });
        await CartRepository.markReminderSent(cart.customerId, stage);
        sent++;
    }
    return sent;
}

export async function processAbandonedCarts(): Promise<{ first: number; second: number }> {
    const first = await processStage(1);
    const second = await processStage(2);
    return { first, second };
}
