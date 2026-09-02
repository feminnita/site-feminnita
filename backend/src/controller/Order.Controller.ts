import { Request, Response } from 'express';
import * as OrderService from '../service/Order.Service';
import * as AuthService from '../service/Auth.Service';
import { setSessionCookie } from './Auth.Controller';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createOrder(req: Request, res: Response) {

    try {
        // Checkout sem login: se não há cliente logado, cria/encontra o cliente
        // em silêncio a partir dos dados do checkout e (quando seguro) já deixa
        // logado via cookie de sessão. Nunca exige login antes de comprar.
        let customerId = req.customer?.id;

        if (!customerId) {
            const guest = (req.body.customer ?? {}) as {
                name?: string;
                email?: string;
                cpf?: string;
                phone?: string;
            };
            const email = String(guest.email ?? '').trim().toLowerCase();
            if (!EMAIL_RE.test(email)) {
                res.status(400).json({ error: 'CUSTOMER_EMAIL_REQUIRED' });
                return;
            }

            const { customer, sessionToken } = await AuthService.findOrCreateGuestCustomer({
                name: String(guest.name ?? '').trim() || email,
                email,
                cpf: guest.cpf ? String(guest.cpf).replace(/\D/g, '') : null,
                phone: guest.phone ? String(guest.phone) : null,
                userAgent: req.headers['user-agent'],
            });

            customerId = customer.id;
            // Só loga automaticamente conta nova/sem senha (findOrCreate decide).
            if (sessionToken) setSessionCookie(res, sessionToken);
        }

        const order = await OrderService.createOrder({
            customerId,
            items: req.body.items,
            paymentMethod: req.body.paymentMethod,
            installments: req.body.installments,
            creditCard: req.body.creditCard,
            couponCode: req.body.couponCode,
            shippingServiceId: Number(req.body.shippingServiceId),
            shippingAddress: req.body.shippingAddress,
            remoteIp: req.ip,
        });
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Erro ao criar pedido';
        if (message === 'MINIMUM_ORDER_NOT_MET') {
            res.status(400).json({ error: 'Seu pedido não atingiu o valor mínimo para finalizar a compra.' });
            return;
        }
        res.status(400).json({ error: message });
    }
}

export async function previewCoupon(req: Request, res: Response) {
    try {
        const code = String(req.body.code ?? '').trim();
        const subtotal = Number(req.body.subtotal);

        if (!code) {
            res.status(400).json({ error: 'COUPON_NOT_FOUND' });
            return;
        }

        if (!Number.isFinite(subtotal) || subtotal <= 0) {
            res.status(400).json({ error: 'INVALID_SUBTOTAL' })
            return;
        }

        const result = await OrderService.previewCoupon(req.customer?.id ?? null, code, subtotal);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao validar cupom' });
    }
}

export async function listMine(req: Request, res: Response) {
    res.json(await OrderService.listMyOrders(req.customer!.id));
}

export async function getMine(req: Request, res: Response) {
    const id = req.params.id as string;

    try {
        res.json(await OrderService.getMyOrder(id, req.customer!.id));
    } catch (error) {
        console.error(error);
        res.status(404).json({ error: 'Pedido não encontrado' })
    }
}
