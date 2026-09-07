import { Request, Response } from 'express';
import * as NewsletterService from '../service/Newsletter.Service';

export async function subscribe(req: Request, res: Response) {
    try {
        res.status(201).json(await NewsletterService.subscribe(req.body));
    } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'EMAIL_INVALIDO') {
            return res.status(400).json({ error: 'Digite um e-mail válido.' });
        }
        console.error('Falha ao inscrever na newsletter:', err);
        res.status(500).json({ error: 'Não foi possível concluir a inscrição. Tente de novo.' });
    }
}

export async function unsubscribe(req: Request, res: Response) {
    try {
        res.json(await NewsletterService.unsubscribe(req.body));
    } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'EMAIL_INVALIDO') {
            return res.status(400).json({ error: 'Digite um e-mail válido.' });
        }
        console.error('Falha ao descadastrar da newsletter:', err);
        res.status(500).json({ error: 'Não foi possível cancelar a inscrição. Tente de novo.' });
    }
}
