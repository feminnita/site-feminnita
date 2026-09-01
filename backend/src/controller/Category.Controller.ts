import { Request, Response } from "express";
import * as CategoryService from '../service/Category.Service';

export async function list(req: Request, res: Response) {
    res.json(await CategoryService.listCategories());
}

export async function getOne(req: Request, res: Response) {
    const id = req.params.is as string;
    try {
        res.json(await CategoryService.getCategoryBySlug(id))
    } catch (error) {
        res.status(404).json({ error: 'Categoria não encontrada' });
    }
}
