import { NextFunction, Request, Response } from 'express';
import * as AuthRepository from '../repository/Auth.Repository';
import { hashSessionToken } from '../utils/sessionToken';
import { CUSTOMER_SESSION_COOKIE } from '../config/auth';

export async function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.[CUSTOMER_SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: 'Não autenticado' });

    const session = await AuthRepository.findActiveSessionByTokenHash(hashSessionToken(token));
    if (!session) return res.status(401).json({ error: 'Sessão inválida ou expirada' });

    req.customer = await AuthRepository.findCustomerById(session.customerId);
    next();
}

// Autenticação OPCIONAL: se houver sessão válida, anexa req.customer; caso
// contrário segue em frente sem 401. Usado no checkout sem login (compra como
// visitante) — a rota decide o que fazer quando não há cliente logado.
export async function optionalCustomerAuth(req: Request, _res: Response, next: NextFunction) {
    const token = req.cookies?.[CUSTOMER_SESSION_COOKIE];
    if (!token) return next();

    const session = await AuthRepository.findActiveSessionByTokenHash(hashSessionToken(token));
    if (!session) return next();

    req.customer = await AuthRepository.findCustomerById(session.customerId);
    next();
}
