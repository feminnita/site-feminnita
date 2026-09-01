import { Request, Response } from 'express';
import * as ProductService from '../service/Product.Service';

export async function list(req: Request, res: Response) {
    res.json(await ProductService.listProducts({
        featured: req.query.featured === 'true',
        categorySlug: typeof req.query.category === 'string' ? req.query.category : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
    }));
}

export async function getOne(req: Request, res: Response) {
    const idOrSlug = req.params.idOrSlug as string;
    try {
        res.json(await ProductService.getProduct(idOrSlug));
    } catch {
        res.status(404).json({ error: 'Produto não encontrado' });
    }
}

export async function getStock(req: Request, res: Response) {
    const idOrSlug = req.params.idOrSlug as string;
    try {
        res.json(await ProductService.getProductStock(idOrSlug));
    } catch (error) {
        res.status(404).json({ error: 'Produto não encontrado' });
    }
}

export async function registerView(req: Request, res: Response) {
    const idOrSlug = req.params.idOrSlug as string;

    try {
        await ProductService.registerView(idOrSlug);
        res.status(204).end();
    } catch {
        res.status(404).json({ error: 'Produto não encontrado' });
    }
}