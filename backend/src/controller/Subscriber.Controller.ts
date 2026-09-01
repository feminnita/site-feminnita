import { Request, Response } from 'express';
import * as SubscriberService from '../service/Subscriber.Service';

function htmlPage(title: string, message: string): string {
    return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — Feminnita</title></head>
    <body style="font-family:system-ui,sans-serif;background:#FAF6F2;color:#3a3a3a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
    <div style="text-align:center;padding:32px;max-width:440px">
        <h1 style="color:#8C2F39;font-weight:600">${title}</h1>
        <p style="font-size:16px;line-height:1.5">${message}</p>
    </div></body></html>`;
}

export async function subscribe(req: Request, res: Response) {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const origin = typeof req.body?.origin === 'string' ? req.body.origin : 'popup';
    try {
        const result = await SubscriberService.subscribe(email, origin);
        // resposta neutra (não revela se já existia) — evita enumeração de e-mails
        res.status(202).json({ ok: true, status: result.status });
    } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_EMAIL') {
            return res.status(400).json({ error: 'E-mail inválido' });
        }
        console.error('Erro ao inscrever:', err);
        res.status(500).json({ error: 'Não foi possível concluir a inscrição' });
    }
}

export async function confirm(req: Request, res: Response) {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const row = await SubscriberService.confirm(token);
    if (!row) {
        return res
            .status(400)
            .send(htmlPage('Link inválido', 'Este link de confirmação é inválido ou já foi usado.'));
    }
    res.send(htmlPage('E-mail confirmado! 🎉', 'Pronto — você vai receber em primeira mão os lançamentos da Feminnita.'));
}

export async function unsubscribe(req: Request, res: Response) {
    const token = typeof req.query.token === 'string' ? req.query.token : undefined;
    const email = typeof req.query.email === 'string' ? req.query.email : undefined;
    await SubscriberService.unsubscribe({ token, email });
    // sempre confirma (não revela existência)
    res.send(htmlPage('Descadastrado', 'Você não vai mais receber nossos e-mails. Sentiremos sua falta 💛'));
}
