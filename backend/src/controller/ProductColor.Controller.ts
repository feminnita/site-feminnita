import { Request, Response } from "express";
import * as ProductColorService from '../service/ProductColor.Service';

export async function list(req: Request, res: Response) {
    res.json(await ProductColorService.listColors());
}
