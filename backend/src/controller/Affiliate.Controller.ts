import { Request, Response } from 'express';
import * as AffiliateService from '../service/Affiliate.Service';

export async function inscrever(req: Request, res: Response) {
    try {
        res.status(201).json(await AffiliateService.inscrever(req.body));
    } catch (err) {
        const msg = err instanceof Error ? err.message : '';

        if (msg === 'NOME_INVALIDO') {
            return res.status(400).json({ error: 'Digite seu nome completo.' });
        }
        if (msg === 'EMAIL_INVALIDO') {
            return res.status(400).json({ error: 'Digite um e-mail válido.' });
        }
        // Inscrever de novo com o mesmo e-mail não é erro dela: é ansiedade de
        // quem não recebeu resposta. Responde como sucesso, sem criar ficha nova.
        if (msg === 'JA_INSCRITA') {
            return res.status(200).json({
                jaInscrita: true,
                mensagem: 'Você já está na lista! Estamos analisando seu cadastro.',
            });
        }

        console.error('Falha na inscrição de afiliada:', err);
        res.status(500).json({ error: 'Não foi possível enviar agora. Tente de novo em alguns minutos.' });
    }
}
