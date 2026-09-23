import { Request, Response } from 'express';
import * as CartService from '../service/Cart.Service';
import * as CartLeadService from '../service/CartLead.Service';

export async function get(req: Request, res: Response) {
    res.json(await CartService.getCart(req.customer!.id));
}

export async function save(req: Request, res: Response) {
    await CartService.saveCart(req.customer!.id, req.body);
    res.status(204).send();
}

export async function merge(req: Request, res: Response) {
    res.json(await CartService.mergeCart(req.customer!.id, req.body.items));
}

export async function clear(req: Request, res: Response) {
    await CartService.clearCart(req.customer!.id);
    res.status(204).send();
}

/**
 * Carrinho de quem esta comprando SEM conta, guardado assim que ela digita o
 * e-mail no checkout.
 *
 * Fica fora do `requireCustomerAuth` de proposito: a cliente aqui nao tem
 * sessao nenhuma — e justamente esse o caso que a loja estava perdendo.
 *
 * Nunca responde erro para a tela: se falhar, a compra segue normal. Isto e
 * captura para lembrete, nao parte do caminho da venda, e nao pode atrapalhar
 * quem esta no meio de comprar.
 */
export async function guardarDeVisitante(req: Request, res: Response) {
    try {
        const { email, name, phone, items } = req.body ?? {};
        res.json(await CartLeadService.guardarCarrinhoDeVisitante({ email, name, phone, items }));
    } catch (error) {
        console.error('Falha ao guardar carrinho de visitante:', error);
        res.json({ guardado: false });
    }
}