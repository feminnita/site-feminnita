import { Request, Response } from 'express';
import * as CartService from '../service/Cart.Service';

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