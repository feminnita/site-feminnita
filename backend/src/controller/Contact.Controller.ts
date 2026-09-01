import { Request, Response } from 'express';
import * as ContactService from '../service/Contact.Service';

export async function send(req: Request, res: Response) {
    try {
        await ContactService.sendContact(req.body as ContactService.ContactInput);
        res.status(200).json({ ok: true });
    } catch (error) {
        const code = error instanceof Error ? error.message : '';

        if (code === 'CONTACT_MISSING_FIELDS') {
            return res.status(400).json({ error: 'Preencha nome, e-mail, assunto e mensagem.' });
        }

        if (code === 'CONTACT_INVALID_EMAIL') {
            return res.status(400).json({ error: 'Informe um e-mail válido.' });
        }

        console.error('Erro ao enviar mensagem de contato: ', error);
        res.status(500).json({ error: 'Não foi possível enviar sua mensagem agora. Tente novamente.' });
    }
}
