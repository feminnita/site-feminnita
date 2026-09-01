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
