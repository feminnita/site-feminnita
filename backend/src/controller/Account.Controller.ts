import { Request, Response } from 'express';
import * as AccountService from '../service/Account.Service';

export async function getProfile(req: Request, res: Response) {
    res.json(await AccountService.getProfile(req.customer!.id));
}

export async function updateProfile(req: Request, res: Response) {
    res.json(await AccountService.updateProfile(req.customer!.id, req.body));
}