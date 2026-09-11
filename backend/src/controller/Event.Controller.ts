import { Request, Response } from 'express';
import * as EventService from '../service/Event.Service';

export async function registrar(req: Request, res: Response) {
    try {
        res.status(201).json(await EventService.registrar(req.body));
    } catch (err) {
        // 204: a vitrine NAO pode quebrar por causa de medicao. Se a gravacao
        // falhar, a cliente segue comprando e o erro fica no log do servidor —
        // nunca na tela dela.
        console.error('Falha ao gravar eventos da vitrine:', err);
        res.status(204).end();
    }
}
