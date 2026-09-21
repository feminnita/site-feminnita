import { Request, Response } from 'express';
import * as OrderService from '../service/Order.Service';
import * as AuthRepository from '../repository/Auth.Repository';

/**
 * Quem esta comprando: a sessao, se houver; senao o formulario do checkout.
 *
 * A compra sem conta nao grava nome e e-mail soltos no pedido — ela resolve
 * uma CLIENTE. Se ja existe uma com aquele e-mail, reaproveita (e completa
 * telefone/CPF que faltavam); se nao existe, cria uma sem senha.
 *
 * Assim o e-mail de confirmacao, o aviso de rastreio, o painel, o Bling e a
 * etiqueta continuam funcionando sem nenhum caminho paralelo.
 */
async function identificarCompradora(req: Request): Promise<string> {
    if (req.customer?.id) return req.customer.id;

    const c = req.body.convidado ?? {};
    const nome = String(c.name ?? '').trim();
    const email = String(c.email ?? '').trim().toLowerCase();
    const telefone = String(c.phone ?? '').trim() || null;
    const cpf = String(c.cpf ?? '').trim() || null;

    if (!nome || !email) throw new Error('GUEST_DATA_REQUIRED');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('GUEST_EMAIL_INVALID');

    const existente = await AuthRepository.findCustomerByEmail(email);
    if (existente) {
        // Nao sobrescreve o nome: quem ja tem conta escolheu como quer ser
        // chamada. Só preenche o que estava vazio.
        await AuthRepository.fillCustomerContact(existente.id, { phone: telefone, cpf });
        return existente.id;
    }

    const nova = await AuthRepository.insertGuestCustomer({ name: nome, email, phone: telefone, cpf });
    return nova.id;
}

export async function createOrder(req: Request, res: Response) {

    try {
        const customerId = await identificarCompradora(req);
        const order = await OrderService.createOrder({
            customerId,
            items: req.body.items,
            paymentMethod: req.body.paymentMethod,
            installments: req.body.installments,
            origem: req.body.origem,
            creditCard: req.body.creditCard,
            couponCode: req.body.couponCode,
            pickup: req.body.pickup === true,
            shippingServiceId: req.body.pickup === true ? undefined : Number(req.body.shippingServiceId),
            shippingAddress: req.body.shippingAddress,
            remoteIp: req.ip,
        });
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao criar pedido' });
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

// Sugestao de cupom para o carrinho. Nunca falha para quem esta comprando:
// sem cupom elegivel, responde vazio e a tela segue igual.
export async function automaticCoupon(req: Request, res: Response) {
    try {
        const subtotal = Number(req.query.subtotal);
        if (!Number.isFinite(subtotal) || subtotal <= 0) {
            res.json(null);
            return;
        }

        res.json(await OrderService.automaticCoupon(req.customer!.id, subtotal));
    } catch (error) {
        console.error('Cupom automatico falhou:', error);
        res.json(null);
    }
}

export async function getPaymentInfo(req: Request, res: Response) {
    try {
        res.json(await OrderService.getPaymentInfo(req.params.id as string, req.customer!.id));
    } catch (error) {
        console.error('Nao consegui montar o pagamento do pedido:', error);
        res.json(null);
    }
}

const FORMAS_ACEITAS = ['pix', 'boleto', 'card'] as const;

export async function changePaymentMethod(req: Request, res: Response) {
    try {
        const metodo = String(req.body.paymentMethod ?? '');
        if (!FORMAS_ACEITAS.includes(metodo as (typeof FORMAS_ACEITAS)[number])) {
            res.status(400).json({ error: 'INVALID_PAYMENT_METHOD' });
            return;
        }

        // A loja promete ate 3x. Numero fora disso e erro de quem chamou, nao
        // escolha da cliente: corta para a faixa em vez de aceitar 12x.
        const pedidas = Number(req.body.installments);
        const parcelas = Number.isFinite(pedidas) ? Math.min(Math.max(Math.trunc(pedidas), 1), 3) : 1;

        const resultado = await OrderService.changePaymentMethod(
            req.params.id as string,
            req.customer!.id,
            metodo as (typeof FORMAS_ACEITAS)[number],
            parcelas,
        );
        res.json(resultado);
    } catch (error) {
        console.error('Troca de forma de pagamento falhou:', error);
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Não foi possível trocar a forma de pagamento',
        });
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
