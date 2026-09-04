import { Request, Response } from 'express';
import * as ResaleTermService from '../service/ResaleTerm.Service';
import * as AuthRepository from '../repository/Auth.Repository';

// Público: devolve a versão vigente + conteúdo (html) do termo.
export async function get(_req: Request, res: Response) {
    try {
        const term = await ResaleTermService.getCurrentResaleTerm();
        res.json(term);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'db' });
    }
}

// Autenticado: grava no cliente logado o aceite da versão vigente + data + IP.
export async function accept(req: Request, res: Response) {
    try {
        const { version } = await ResaleTermService.getCurrentResaleTerm();
        const ip = req.ip ?? null;
        await AuthRepository.acceptResaleTerm(req.customer!.id, version, ip);
        res.json({ ok: true, version });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao aceitar termo' });
    }
}
